const core = require('@actions/core');
const axios = require('axios');


(async function main() {
    const instanceName = core.getInput('instance-name', { required: true });
    const toolId = core.getInput('tool-id', { required: true });
    const username = core.getInput('devops-integration-user-name', { required: true });
    const pass = core.getInput('devops-integration-user-pass', { required: true });
    const taskState = core.getInput('state', { required: true });
    let commits;

    const defaultHeaders = {
        'Content-Type': 'application/json'
    }

    if (!!core.getInput('commits')) {
        try {
            commits = JSON.parse(core.getInput('commits'));
        } catch (e) {
            core.setFailed(`Failed parsing commits string value ${e}`);
        }
    }

    let upstreamTaskUrl = core.getInput('upstream-task-url');

    if (!upstreamTaskUrl) {
        console.log("No upstream task URL");
    } else {
        console.log("Upstream task URL is ", upstreamTaskUrl);
    }

    let githubContext = core.getInput('context-github', { required: true })

    try {
        githubContext = JSON.parse(githubContext);
    } catch (e) {
        core.setFailed(`exception parsing github context ${e}`);
    }

    let orchestrationTaskUrl = githubContext.workflow.trim().replace(" ", "+")
    const endpoint = `https://${username}:${pass}@${instanceName}.service-now.com/api/sn_devops/v1/devops/tool/orchestration?toolId=${toolId}`

    html_url = githubContext.event.repository.html_url;

    let notificationPayload;
    try {
        notificationPayload = {
            toolid: toolId,
            buildNumber: githubContext.run_number,
            nativeId: githubContext.run_id,
            name: githubContext.workflow,
            id: githubContext.run_id,
            url: `${githubContext.event.repository.html_url}/actions/runs/${githubContext.run_id}/${githubContext.job}`,
            isMultiBranch: false,
            orchestrationTaskUrl: `${html_url}/actions/runs/${githubContext.run_id}`,
            orchestrationTaskName: `${githubContext.workflow}#${githubContext.job}`,
            orchestrationTask: {
                toolId: toolId,
                orchestrationTaskURL: `${html_url}/actions/workflows/${githubContext.workflow}.yml?job=${githubContext.job}`,
                orchestrationTaskName: `${githubContext.workflow}#${githubContext.job}`
            },
            //upstreamTaskUrl: `${html_url}/actions/?query=workflow:\\"${orchestrationTaskUrl}\\"`,
            result: taskState
        }

        if (upstreamTaskUrl) {
            notificationPayload.upstreamTaskUrl = upstreamTaskUrl;
        }
        
    } catch (e) {
        core.setFailed(`exception setting notification payload ${e}`)
        return;
    }

    if (commits) {
        notificationPayload.commits = commits
    }

    let notification;

    try {
        let notificationConfig = { headers: defaultHeaders };
        notification = await axios.post(endpoint, JSON.stringify(notificationPayload), notificationConfig)
    } catch (e) {
        core.setFailed(`exception POSTing notification payload to ServiceNow: ${e}\n\n${JSON.stringify(notificationPayload)}\n\n${e.toJSON}`)
    }

    core.setOutput('task-execution-url', `${githubContext.event.repository.html_url}/actions/runs/${githubContext.run_id}/${githubContext.job}`)
})();