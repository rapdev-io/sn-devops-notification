const core = require('@actions/core');
const axios = require('axios');


(async function main() {
    const instanceName = core.getInput('instance-name', { required: true });
    const toolId = core.getInput('tool-id', { required: true });
    const username = core.getInput('devops-integration-user-name', { required: true });
    const pass = core.getInput('devops-integration-user-pass', { required: true });
    const taskState = core.getInput('state', { required: true })
    const commits = core.getInput('commits')
    const defaultHeaders = {
        'Content-Type': 'application/json'
    }
    let githubContext = core.getInput('context-github', { required: true })

    try {
        githubContext = JSON.parse(githubContext);
    } catch (e) {
        core.setFailed(`exception parsing github context ${e}`);
    }

    const endpoint = `https://${username}.${pass}@${instanceName}.service-now.com/api/sn_devops/v1/devops/tool/orchestration?toolId=${toolId}`

    let notificationPayload;
    try {
        notificationPayload = {
            toolid: toolId,
            buildNumber: githubContext.run_number,
            nativeId: githubContext.run_id,
            name: githubContext.workflow,
            id: githubContext.run_id,
            url: `githubContext.event.repository.html_url}/actions/runs/${github.run_id}`,
            isMultiBranch: false,
            orchestrationTaskUrl: `${githubContext.event.repository.html_url}/actions/runs/${githubContext.run_id}`,
            orchestrationTaskName: `${github.workflow}#${github.job}`,
            orchestrationTask: {
                toolId: toolId,
                orchestrationTaskURL: `${github.event.repository.html_url}/actions/?query=workflow:\\"${orchestrationTaskUrl}\\"`,
                orchestrationTaskName: `${github.workflow}#${github.job}`
            },
            result: taskState
        }
    } catch (e) {
        core.setFailed(`exception setting notification payload ${e}`)
    }

    if (commits) {
        notificationPayload.commits = commits
    }

    let notification;

    try {
        let notificationConfig = { headers: defaultHeaders };
        notification = await axios.post(endpoint, notificationPayload, notificationConfig)
    } catch (e) {
        core.setFailed(`exception POSTing notification payload to ServiceNow: ${e}`)
    }
})();