<!-- # ZAPI -->
# Zephyr Api
A simpified wrapper for making common zephyr for jira cloud api calls.
This package uses native promises so all calls are thenable.

## Install: 
```
npm install zephyr_api
```

## Auth: Save credential variable as gloabl var to be used by the module:

```
global.__ZAPIcreds = [process.env.ZAPI_ACCESS_KEY, process.env.ZAPI_SECRET_KEY, process.env.ASSIGNEE];
```

## Require the module: 
```
const ZAPI = require('zephyr_api');
```



## Then use the available funtions :


#### Get a cycleId from a cyleName
```
ZAPI.getCycleIdFromCycleName(jiraProjectId: '156478', jiraProjectVersion: '45678', cycleName: 'myTestCycle');
``` 


#### Get a list of all cycles
```
ZAPI.getAllCycles(jiraProjectId: '45678', jiraProjectVersion: '45675');
```


#### Perform a zephyr test search
Pass in the query as a string. 
[ZQL ref](https://zephyrdocs.atlassian.net/wiki/spaces/ZTD/pages/12648460/ZQL+Reference)
```
let string = 'project=14598 AND issuetype=Test AND labels=RegressionTests';
ZAPI.zqlSearch(query: string);
```


#### Create a new cycle
The cycleId parameteter is optional and allows you to copy cycle info from an existing cyle.
```
let bodyData = {
	'name': `Name of your test cycle`,
	'build': 'Latest Build',
	'environment': 'dev',
	'description': `Enter your cycle description here`,
	'startDate': Date.now(), // or w/e you want
	'endDate': Date.now() + 600000,  // or w/e you want
	'projectId': yourProjectId,
	'versionId': yourVersionId
};
ZAPI.createNewCycle(body: bodyData, cycleId: '5458678945264654643524685764654');
```


#### Create a new execution
```
ZAPI.createExecution(cycleId:'45676456456484688945465446' , projectId: '14578', versionId: '14578', issueId: '15623', testStatus: '0', assignee: 'username@email.com');
```


#### Get execution statuses
These are the pass / fail statuses
```
ZAPI.getExecutionStatuses();
```


#### Get execution info
```
ZAPI.getExecutionInfo(issueId: '14578', projectId: '12345', cycleId: '123121245644456677', executionId: '545645465465489756487');
```


#### Get test steps for a given test
```
ZAPI.getTestSteps(issueId: '14578', testId: '12345', projectId: '12356');
```


#### Update a step result
```
ZAPI.stepResultUpdate(stepResultId: '1654612368546454', issueId: '12345', executionId: '45648676545263567456', status: '0');
```


#### Update a test step
```
ZAPI.testStepUpdate(testStep: 'User logs in', testData: 'User Credentials', expectedResult: 'User is able to log in', stepNum: '1', testId: '12345', projectId: '12356');
```


#### Delete all steps for a given test
Note: this does an api call for each step
```
ZAPI.deleteAllTestSteps(testId: '12345', projectId: '45678');
```


#### Get server info
```
ZAPI.getServerInfo();
```


#### Get license info
```
ZAP.getLicenseInfo();
```


#### Get general info
```
ZAPI.getGeneralInfo();
```


#### Get a cycles issue ids
```
ZAPI.getCyclesIssueIds(cycleId: string, versionId: string, projectId: string);
```


## Reference
A lot of the ids above have similar names. Here are some examples of where to find these ids. 

jiraProjectId - You can get this from the Jira API , https://docs.atlassian.com/jira/REST/cloud/#api/2/project-getAllProjects
For example a GET on https://company.atlassian.net/rest/api/2/project

jiraProjectVersion - Once you get the project Id from the above call you can append it to the same url to get the different versions: 
For example a get on https://company.atlassian.net/rest/api/2/project/14578

cycleId - User the provided funciton above to convert the name to an id or use the provided get all cylces and parse the results to grab the id. 

issueId - You can get this from the Jira API , https://docs.atlassian.com/jira/REST/cloud/#api/2/issue
For example a GET on https://company.atlassian.net/rest/api/2/issue/AOE-1234

executionId - From calling the getExecutionsStatuses above

stepResultId - From having the result of an execution id and getting that execution info

#### Prereq: node 6.10+