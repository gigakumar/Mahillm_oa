const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'mech-prep-app-connector',
  service: 'mech-prep-app-db',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;

const upsertMistakeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpsertMistake', inputVars);
}
upsertMistakeRef.operationName = 'UpsertMistake';
exports.upsertMistakeRef = upsertMistakeRef;

exports.upsertMistake = function upsertMistake(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(upsertMistakeRef(dcInstance, inputVars));
}
;

const resolveMistakeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ResolveMistake', inputVars);
}
resolveMistakeRef.operationName = 'ResolveMistake';
exports.resolveMistakeRef = resolveMistakeRef;

exports.resolveMistake = function resolveMistake(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(resolveMistakeRef(dcInstance, inputVars));
}
;

const updateMistakeNoteRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateMistakeNote', inputVars);
}
updateMistakeNoteRef.operationName = 'UpdateMistakeNote';
exports.updateMistakeNoteRef = updateMistakeNoteRef;

exports.updateMistakeNote = function updateMistakeNote(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateMistakeNoteRef(dcInstance, inputVars));
}
;

const updateMistakeTypeRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateMistakeType', inputVars);
}
updateMistakeTypeRef.operationName = 'UpdateMistakeType';
exports.updateMistakeTypeRef = updateMistakeTypeRef;

exports.updateMistakeType = function updateMistakeType(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateMistakeTypeRef(dcInstance, inputVars));
}
;

const listUserMistakesRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListUserMistakes', inputVars);
}
listUserMistakesRef.operationName = 'ListUserMistakes';
exports.listUserMistakesRef = listUserMistakesRef;

exports.listUserMistakes = function listUserMistakes(dcOrVars, varsOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrVars, varsOrOptions, options, true, true);
  return executeQuery(listUserMistakesRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
