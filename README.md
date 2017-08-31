# ZAPI

prereq: node 6.10

save credential variable as gloabl var to be used in the module:

global.__ZAPIcreds = [process.env.ZAPI_ACCESS_KEY, process.env.ZAPI_SECRET_KEY, process.env.ASSIGNEE];

available funtions :

	getCycleIdFromCycleName(jiraProjectId: string, jiraProjectVersion: string, cycleName: string) 

	getAllCycles(jiraProjectId: string, jiraProjectVersion: string) 

	zqlSearch(query: string) 



	createNewCycle(body: object, cycleId: string) 
	let body = {
        'name': `Name of your test cycle`,
        'build': 'Latest Build',
        'environment': 'dev',
        'description': `Enter your cycle description here`,
        'startDate': Date.now(), // or w/e you want
        'endDate': Date.now() + 600000,  // or w/e you want
        'projectId': yourProjectId,
        'versionId': yourVersionId
    };


	createExecution(cycleId:string , projectId: string, versionId: string, issueId: string, testStatus: string, assignee: string) 

	getExecutionStatuses() 

	getExecutionInfo(issueId: string, projectId: string, cycleId: string, executionId: string) 

	stepResultUpdate(stepResultId: string, issueId: string, executionId: string, status: string) 

	testStepUpdate(testStep: string, testData: string, expectedResult: string, stepNum: string, testId: string, projectId: string) 

	deleteAllTestSteps(testId: string, projectId: string) 

	getServerInfo() 

	getLicenseInfo() 

	getGeneralInfo() 

	getCyclesIssueIds(cycleId: string, versionId: string, projectId: string) 

	getTestStep(issueId: string, testId: string, projectId: string) 
