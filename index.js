const jwt = require('json-web-token');
const request = require('request');
const crypto = require('crypto');

function callZapiCloud(METHOD, API_URL, CONTENT_TYPE, ACCESS_KEY, SECRET_KEY, USER, BODY) {
	const hash = crypto.createHash('sha256');
	const iat = new Date().getTime();
	const exp = iat + 3600;
	const BASE_URL = 'https://prod-api.zephyr4jiracloud.com/connect';
	let RELATIVE_PATH = API_URL.split(BASE_URL)[1].split('?')[0];
	let QUERY_STRING = API_URL.split(BASE_URL)[1].split('?')[1];
	let CANONICAL_PATH;
	if (QUERY_STRING) {
		CANONICAL_PATH = `${METHOD}&${RELATIVE_PATH}&${QUERY_STRING}`;
	} else {
		CANONICAL_PATH = `${METHOD}&${RELATIVE_PATH}&`;
	}

	hash.update(CANONICAL_PATH);
	let encodedQsh = hash.digest('hex');

	let payload = {
		'sub': USER,
		'qsh': encodedQsh,
		'iss': ACCESS_KEY,
		'iat': iat,
		'exp': exp
	};

	let token = jwt.encode(SECRET_KEY, payload, 'HS256', function(err, token) {
		if (err) { console.error(err.name, err.message); }
		else { return token; }
	});

	let options = {
		'method': METHOD, 'url': API_URL,
		'headers': {
			'zapiAccessKey': ACCESS_KEY,
			'Authorization': 'JWT ' + token,
			'Content-Type': CONTENT_TYPE
		},
		'json': BODY
	};

	let result = createPromiseCall(false, options);
	return result;
}
function createPromiseCall(debug, params) {
	return new Promise(function(resolve, reject) {
		request(params, function(error, response, body) {
			if (error) return reject(error);
			if (debug) {
				console.log(params);
				console.log(body);
			}
			resolve(body);
		});
	}).catch(function(e) { console.log(`An error had occured with the api call: "${e}"`); });
}

module.exports = {
	getCycleIdFromCycleName: function(jiraProjectId, jiraProjectVersion, cycleName) {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/cycles/search?projectId=${jiraProjectId}&versionId=${jiraProjectVersion}`, 'text/plain', ...__ZAPIcreds).then(allCycles => {
			let currentCycleId = findCycleByName(JSON.parse(allCycles), cycleName);
			if (currentCycleId) {
				return { projectId: jiraProjectId, versionId: jiraProjectVersion, id: currentCycleId };
			} else {
				return null;
			}
			function findCycleByName(allCycles, name) {
				let id = false;
				allCycles.forEach(item => {
					item.name === name ? id = item.id : id = false;
				});
				return id;
			}
		});
	},
	getAllCycles: function(jiraProjectId, jiraProjectVersion) {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/cycles/search?expand=executionSummaries&projectId=${jiraProjectId}&versionId=${jiraProjectVersion}`, 'text/plain', ...__ZAPIcreds).then(d => JSON.parse(d).filter(a => a.name != 'Ad hoc'))
			.then(allCycles => {
				let allCyclesResult = [];
				allCycles.forEach(a => {
					let buildCycleObject = {};
					buildCycleObject.name = a.name;
					buildCycleObject.id = a.id;
					buildCycleObject.totalExecuted = a.totalExecuted;
					buildCycleObject.totalExecutions = a.totalExecutions;

					buildCycleObject.execSummaries = (() => {
						let resultArray = [];
						a.executionSummaries.forEach(a => {
							resultArray.push({
								status: a.executionStatusName,
								count: a.count
							});
						});
						return resultArray;
					})();

					allCyclesResult.push(buildCycleObject);
				});
				return allCyclesResult;
			});
	},
	zqlSearch: function(query) {
		return callZapiCloud('POST', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/zql/search?`, 'application/json', ...__ZAPIcreds, { 'zqlQuery': `${query}` }).then(searchResults => {
			let result = {
				totalTests: searchResults.totalCount,
				tests: []
			};
			searchResults.searchObjectList.forEach(a => {
				result.tests.push({
					key: a.issueKey,
					summary: a.issueSummary,
					status: a.execution.status.name,
					desc: a.issueDescription,
					executionId: a.execution.id,
					issueId: a.execution.issueId
				});
			});
			return result;
		});
	},
	createNewCycle: function(body, cycleId) {
		if (cycleId) {
			return callZapiCloud('POST', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/cycle?clonedCycleId=${cycleId}`, 'application/json', ...__ZAPIcreds, body);
		} else {
			return callZapiCloud('POST', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/cycle`, 'application/json', ...__ZAPIcreds, body);
		}
	},
	createExecution: function(cycleId, projectId, versionId, issueId, testStatus, assignee) {
		let body = { 'status': { 'id': testStatus }, 'projectId': projectId, 'issueId': issueId, 'cycleId': cycleId, 'versionId': versionId, 'assigneeType': 'assignee', 'assignee': assignee };
		return callZapiCloud('POST', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/execution`, 'application/json', ...__ZAPIcreds, body).then(createExecution => {
			return callZapiCloud('PUT', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/execution/${createExecution.execution.id}`, 'application/json', ...__ZAPIcreds, { 'status': { 'id': testStatus }, 'projectId': projectId, 'issueId': issueId, 'cycleId': cycleId, 'versionId': versionId });
		});
	},
	getExecutionStatuses: function() {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/execution/statuses`, 'application/json', ...__ZAPIcreds).then(getStatuses => JSON.parse(getStatuses).forEach(a => console.log(`${a.id} ${a.name} ${a.description}`)));
	},
	getExecutionInfo: function(issueId, projectId, cycleId, executionId) {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/stepresult/search?executionId=${executionId}&issueId=${issueId}`, 'application/text', ...__ZAPIcreds).then(getStepResults => {
			let stepIds = [];
			JSON.parse(getStepResults).stepResults.forEach(a => {
				stepIds.push({ id: a.id, status: a.status.description });
			});
			stepIds.unshift('spacer');
			return { stepIds: stepIds, executionId: executionId };
		});
	},
	stepResultUpdate: function(stepResultId, issueId, executionId, status) {
		let testStepData = { 'status': { 'id': status }, 'issueId': issueId, 'stepId': stepResultId, 'executionId': executionId };
		return callZapiCloud('PUT', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/stepresult/${stepResultId}`, 'application/json', ...__ZAPIcreds, testStepData);
	},
	createNewTestStep: function(testStep, testData, expectedResult, testId, projectId) {
		let testStepData = { "step": testStep, "data": testData, "result": expectedResult };
		return callZapiCloud('POST', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/teststep/${testId}?projectId=${projectId}`, 'application/json', ...__ZAPIcreds, testStepData);
	},
	testStepUpdate: function(testStep, testData, expectedResult, stepNum, testId, projectId) {
		let testStepData = {
			'orderId': stepNum,
			'issueId': testId,
			'step': testStep,
			'data': testData,
			'result': expectedResult,
			'createdBy': 'admin'
		};
		return callZapiCloud('POST', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/teststep/${testId}?projectId=${projectId}`, 'application/json', ...__ZAPIcreds, testStepData);
	},
	deleteAllTestSteps: function(testId, projectId) {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/teststep/${testId}?projectId=${projectId}`, 'application/json', ...__ZAPIcreds).then(testSteps => {
			JSON.parse(testSteps).forEach(a => {
				callZapiCloud('DELETE', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/teststep/${testId}/${steps[i].id}?projectId=${projectId}`, 'application/text', ...__ZAPIcreds).then(a => console.log(a));
			});
		});
	},
	getServerInfo: function() {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/serverinfo`, 'application/text', ...__ZAPIcreds);
	},
	getLicenseInfo: function() {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/zlicense/addoninfo`, 'application/text', ...__ZAPIcreds);
	},
	getGeneralInfo: function() {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/config/generalinformation`, 'application/text', ...__ZAPIcreds);
	},
	getCyclesIssueIds: function(cycleId, versionId, projectId) {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/cycle/${cycleId}?expand=executionSummaries&projectId=${projectId}&versionId=${versionId}`, 'text/plain', ...__ZAPIcreds);
	},
	getTestSteps: function(issueId, projectId) {
		return callZapiCloud('GET', `https://prod-api.zephyr4jiracloud.com/connect/public/rest/api/1.0/teststep/${issueId}?projectId=${projectId}`, 'application/json', ...__ZAPIcreds).then(step => JSON.parse(step));
	}
};
