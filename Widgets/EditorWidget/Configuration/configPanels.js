let refs = null;

export function start(_refs)
{
	refs = _refs;
    setupSettingsPanel();
}

function setupSettingsPanel()
{
	refreshConfigObject("planetCnfg"); 
	refreshConfigObject("biomeCnfg"); 
	refreshConfigObject("terrainBodyCnfg");
}
function refreshConfigObject(path, ignoreContainer, objName="")
{
	const splitPath = path.split("-");
	let contId = splitPath[0]; 
	const containers = document.querySelectorAll("#"+contId);
	containers.forEach(container=>{
		if (container!==ignoreContainer){
		if (splitPath.length<=1 || container.childCount < 1 || container.childNodes[0].id==path)setupConfigObject(container, objName); 
	}});
}

function setupConfigObject(container, selectedObjName="")
{
	let array = null; let contId = container.id;
	
	array = refs.dtm.ListTypeMap.get(contId);
	// switch (contId)
	// {
	// 	case "planetCnfg": array=refs.dtm.planets; break;
	// 	case "biomeCnfg": array=refs.dtm.biomeDatas; break;
	// 	case "terrainBodyCnfg": array=terrainBodies; break;
	// 	default: break; 
	// }
	container.innerHTML = getObjectConfigHTML(contId,array, selectedObjName); 
}
function getObjectConfigHTML(id, array, selectedObjName="")
{
	let selObj=array[0]; let selectedIndx = 0;
	if (selectedObjName)  
	{
		selObj = array.find(el=>el.name===selectedObjName);
		selectedIndx = array.indexOf(selObj);
	}
	else {selectedObjName = selObj.name;}
	
	
	let titleText = ""; let baseOption = ""; let isNew=selectedObjName=="new";
	if (id=="planetCnfg") {baseOption = "New Planet"; titleText="Planets"}
	else if (id=="biomeCnfg") {baseOption = "New Biome"; titleText="Biomes"}
	else if (id=="terrainBodyCnfg") {baseOption = "New Terrain Body"; titleText="Terrain Body"}
	let dropdownHTML= "<select id='" + id + "-" + selectedObjName + "-select" + "' onchange='switchConfigObject(this)'><option value='new'>"+baseOption+"</option>";
	array.forEach((el, i) => {if (el.name!="new"){dropdownHTML += `<option ${selectedIndx==i?"selected":""}>${el.name}</option>`}})
	dropdownHTML+="</select>"; 
	let textVal = isNew?"":selectedObjName;
	let innerHTML = `<h2 id="${id}-${selectedObjName}"><span class="config-title">${titleText}</span> <input type="text" value="${textVal}" onchange="onChangeConfigObjectName(this)" ${isNew?"placeholder='"+baseOption+"'":""} id="${id+"-"+selectedObjName+"-name"}">${dropdownHTML} <input type="button" value="▼" onclick="togglePanelCollapse(this)"></h2>`;
	
	innerHTML += objectToFormHTML(selObj, id);
	return innerHTML; 
}
function objectToFormHTML(object, idPreface="")
{
	let objectHTML = "";
	if (idPreface) {idPreface = idPreface + "-" + object.name;}
	else {idPreface = object.name;}
	for (let property in object)
	{
		if (property=="name" || property=="ignrPs" || object.ignrPs.includes(property)) {continue;}
		objectHTML += createInputFieldForValue(property, object[property], idPreface, refs.dtm.attributeTypeDict.has(property)?refs.dtm.attributeTypeDict.get(property):null)+"<br>";
	}
	return objectHTML;
}
function createInputFieldForValue(property, value, idPreface="", typeParams=null, hideLabel=false, customCallback=null, isSubField=false)
{
	let iFHTML = "";
	let typestring = "text"; let valstringprop="value"; let inputFormat=0;
	let id = (idPreface ? idPreface + "-": "") + property;
	switch (typeof value)
	{
		case "string" : typestring="text";break;
		case "boolean" : typestring="checkbox"; valstringprop="checked";break;
	}
	if (Array.isArray(value)) {inputFormat=4;}
	
	if (typeParams && typeParams.length > 0)
	{
		if (typeParams[0] == refs.dtm.InputTypeTags.Select)
		{
			inputFormat=5;
		}
		else if (typeParams[0] == refs.dtm.InputTypeTags.TagList)
		{
			inputFormat=6;
		}
		else if (typeParams[0] == refs.dtm.InputTypeTags.Array)
		{ 
			inputFormat=4;
		}
		else if (typeParams[0] == refs.dtm.InputTypeTags.Vector)
		{
			inputFormat=3;
		}
		else if (typeParams[0] == refs.dtm.InputTypeTags.Int)
		{
			inputFormat=0;
		}
		else if (typeParams[0] == refs.dtm.InputTypeTags.Float)
		{ 
			inputFormat=1;
		}
		else 
		{
			console.log("unknown typeParams:",typeParams); 
		}
		// return iFHTML;
	}
	
	if (inputFormat<3) //standard single input
	{
		if (!hideLabel){iFHTML += `<label for="${id}">${property}: </label>`;}
		iFHTML+=`<input${isSubField? " class='sub-field'":""} id="${id}" type='${typestring}' ${ typestring=="checkbox"? (value?"checked":"") : `${valstringprop}="${value}"`} onchange="onAttributeFieldChange(this)">`;
	}
	else if (inputFormat==3)
	{
		iFHTML+=createVectorFieldInputs(property,value,idPreface,typeParams, hideLabel,customCallback, isSubField);
	}
	else if (inputFormat==4)
	{
		iFHTML+=createArrayFieldInputs(property,value,idPreface, false,typeParams, hideLabel,customCallback, isSubField);
	}
	else if (inputFormat==5)
	{
		iFHTML+=createDropdownSelectInput(property, value, idPreface, typeParams, hideLabel,customCallback, isSubField);
	}
	else if (inputFormat==6)
	{
		iFHTML+=createTagListInput(property,value,idPreface,false,typeParams, hideLabel,customCallback, isSubField);
	}
	return iFHTML;
}
function createDropdownSelectInput(propName, value, idPreface, typeParams=null, hideLabel=false, customCallback=null, isSubField=false)
{
	let id = (idPreface ? idPreface + "-": "") + propName;
	let inputType = typeParams[1]; 
	
	const optArray = refs.dtm.ListTypeMap.get(inputType);
	let customLabel = value;
	let classList = [];
	if (value==="") {value="select";}
	else if (inputType === "Block" && value >= 0 && value < optArray.length)
	{customLabel = optArray[value].name; classList.push('inputTag-Block');}
	if (isSubField) {classList.push('sub-field');}
	
	if (!customCallback) {customCallback="onAttributeFieldChange(this)"}
	let dropdownHTML = `${hideLabel ? "" : propName+":"} <select ${classList.length>0?"class="+classList.join(" ")+"" :""} id="${id}" onchange="${customCallback}"><option>${customLabel}</option>`;
	optArray.forEach(opt=>{
		if (opt.name != value && opt.name!=customLabel)
		{
			dropdownHTML+=`<option>${opt.name}</option>` 
		}
	})
	
	dropdownHTML+= "</select>";
	return dropdownHTML;
}
function createArrayFieldInputs(arrayName, array, idPreface="", shown=false,typeParams=null, hideLabel=false,customCallback=null, isSubField=false)
{
	let isFlex = true; let arraySize=0;
	if (typeParams) {if (typeParams[1]===refs.dtm.InputTypeTags.Flex) {}else {isFlex=false;
		arraySize = parseInt(typeParams[1]);}}
	 
	let id = (idPreface ? idPreface + "-": "") + arrayName;
	let arrayHTML =`<span id=${id} class='tl-config-array-list${!shown?" collapsed":""}'><span class='tl-config-array-label'>${arrayName}: <input type="button" onclick="toggleArrayExpand(this)" value="${shown ? "△" : "▽"}">` + (isFlex?`        <input class="quick-mod-button" type="button" onclick="onChangeArrayLength(this,1)" value="+"><input type="text" onchange="onChangeArrayLength(this)" value="${array.length}"><input class="quick-mod-button" type="button" onclick="onChangeArrayLength(this,-1)" value="-">`:"")+"</span>";
	 
	// if (shown)
	{
		const nextTypeParams = typeParams?typeParams.slice(2,typeParams.length):null;
		if (!array || !Array.isArray(array) || (array.length < arraySize && !isFlex)) 
		{
			let newArray = new Array(arraySize); 
			for (let i =0; i < arraySize;i++){
			if (array && Array.isArray(array) && i < array.length) {newArray[i]=array[i];}
				else {newArray[i]=getDefaultValofInputTags(nextTypeParams);}
				}
			getVariableForField(id, newArray, true) //Set the array
			array = newArray;
		}
		else if (isFlex)(arraySize =array.length);
		
		
		
		//let arrayHTML =`<label class='tl-config-array-label' for=${id}>${arrayName}: </label>`; 
		// arrayHTML += `<span id=${id}>`;
		arrayHTML+="<br><div class='list-indent'>"
		array.forEach((el, i) =>
		{
			if (i < arraySize)
			{
			arrayHTML += createInputFieldForValue(i, el, id, nextTypeParams, false, null, true) + (i<array.length-1? "<br>" : "");}
		});
		arrayHTML+= "</div>"; 
	}
	return arrayHTML+"</span>";
}
function createVectorFieldInputs(propName, array, idPreface="", typeParams=null,hideLabel=false,customCallback=null, isSubField=false)
{
	let id = (idPreface ? idPreface + "-": "") + propName;
	let vectorHTML =`${hideLabel?"":propName+":"} `; 
	const vectorData = typeParams[1]; 
	const pkts = vectorData.split("|");
	const vectorSize = parseInt(pkts[0]);
	let axisNames= pkts.length > 0 ? pkts[1].split(",") : null;//labels
	if (!axisNames || axisNames.length <= 1) {axisNames=null;}
	const newTypeParams = typeParams.slice(2,typeParams.length);
	const subTypeParams = pkts.length > 1 && pkts[2] ? pkts[2].split(",") : null;
	if (!array || !Array.isArray(array) || array.length < vectorSize) 
	{
		// console.log("mismatch!: " + id);
		let newArray = new Array(vectorSize); 
		if (array && Array.isArray(array)) {for (let i =0; i < array.length;i++) {newArray[i]=array[i];}}
		getVariableForField(id, newArray, true) //Set the array
	}
	for (let i = 0; i < vectorSize; i++) 
	{
		let elVal = i < array.length ? array[i]:0;
		if (axisNames && i < axisNames.length) {vectorHTML+= axisNames[i] + ":";}
		vectorHTML+=createInputFieldForValue(i, elVal, id, subTypeParams ? subTypeParams[Math.min(i,subTypeParams.length-1)].split(".") : newTypeParams, true,null, true);
			// `<input type="text">`;
	}  
	return vectorHTML; 
}
function createTagListInput(tagListName, tagList, idPreface="", idReplace="", typeParams=null, hideLabel=false,customCallback=null, isSubField=false)
{
	let id = (idPreface ? idPreface + "-": "") + tagListName;
	if (idReplace) {id=idReplace; tagListName = id.split("-")[id.split("-").length-1]; 
								 idPreface = id.slice(0,id.length-tagListName.length);}
	let tagsHTML =`<p class="tl-taglist" id="${id}">${tagListName}:`;
	tagList.forEach((el, i) =>
	{
		let tagId = id + "-" + el;
		tagsHTML += `<span id="${tagId}" class="tl-input-tag">${el}<input type="button" onclick="removeTag(this,'${tagListName}')" value="✖"></span>`;
	});
	tagsHTML += `<span id="${id}-newTagBtn" class="tl-input-tag tl-input-addtag"  onclick="addTag(this, '${tagListName}')">Add ＋</span>`;
	tagsHTML+= "</p>";
	return tagsHTML;
}
window.beginDragTag = function(el, propName, shiftAmnt)
{
	
}
window.removeTag = function(el, propName) {
	const spltId =  el.parentElement.id.split("-");
	let fieldList = getVariableForField(el.parentElement.parentElement);
	if (fieldList.length <= 1 && propName == "biomes") {return;} 
	const remIndx = fieldList.indexOf(spltId[spltId.length-1]);
	fieldList.splice(remIndx,remIndx+1);
	const objToUpdate = getObjectOwningField(el.parentElement.parentElement);
	objToUpdate.onChangeAttribute(); 
	
	const confContainer = getFieldConfigContainer(el.parentElement);
	refreshConfigObject(confContainer.childNodes[0].id, confContainer);
	
	el.parentElement.parentElement.innerHTML = createTagListInput("",fieldList,"",el.parentElement.parentElement.id);
	window.onTriggerPreviewUpdate();
	
}; 
window.addTag = function(el, propName) {
	el.onclick=null;
	if (refs.dtm.attributeTypeDict.has(propName))
	{
		let propVal = getVariableForField(el.parentElement);
		let typeParams = refs.dtm.attributeTypeDict.get(propName);
		let innerHTML = createInputFieldForValue("newTag", "", "", typeParams.slice(1,typeParams.length), true,"confirmAddTag(this)", true);
		innerHTML+="<input type='button' onclick='confirmAddTag(this)' value='＋'>";
		el.innerHTML = innerHTML;
	}
	
	return;
	if (propName=="biomes") //Change just to be anything requiring dropdown
	{
		const obj = getParentVariableOfField(el.parentElement);
		let innerHTML = "<select onchange='confirmAddTag(this)'><option value='na'>select</option>"; let optionsChoice = [];
		if (propName=="biomes") {refs.dtm.biomeDatas.forEach(biome=>{if (biome.name!="new" && !obj[propName].includes(biome.name)){optionsChoice.push(biome.name);}});}
		optionsChoice.forEach(option=>innerHTML+=`<option value="${option}">${option}</option>`);
		innerHTML += "</select> <input type='button' onclick='confirmAddTag(this)' value='＋'>";
		el.innerHTML = innerHTML;
	}
	else
	{
		el.innerHTML ="<input type='text'> <input type='button' onclick='confirmAddTag(this)' value='＋'>";
		const inputText = el.querySelector("input[type=text]");
		inputText.focus();
		inputText.addEventListener("keydown", e => {if (e.key==="Enter") {confirmAddTag(inputText)}});
	}
}; 
window.confirmAddTag = function(el) {
	el = el.parentElement;
	let inputTextEl = el.querySelector("input[type=text]");
	if (!inputTextEl) {inputTextEl = el.querySelector("select");}
	let inputText = inputTextEl.value;
	let validInput = inputText != "na";
	const fieldVar = getVariableForField(el.parentElement);
	if (validInput) 
	{
		fieldVar.push(inputText);
		let objToUpdate = getObjectOwningField(el.parentElement);
		objToUpdate.onChangeAttribute(); window.onTriggerPreviewUpdate();
	}
	const confContainer = getFieldConfigContainer(el);
	refreshConfigObject(confContainer.childNodes[0].id, confContainer);
	el.parentElement.innerHTML = createTagListInput("",fieldVar,"",el.parentElement.id);
};

window.onChangeConfigObjectName = (el) =>
{
	let oldVal = getVariableForField(el);
	let newVal =  el.value; 
	
	if (oldVal == newVal) {return;}
	const obj = getObjectOwningField(el);
	getVariableForField(el, newVal, true);
	const isNewObject = obj.oldName=="new";
	
	obj.onChangeAttribute();
	 
	const confContainer = getFieldConfigContainer(el);
	// if (!isNewObject)
	// 
		refreshConfigObject(confContainer.childNodes[0].id, null, newVal);
	// else
	// {
	// 	refreshConfigObject(confContainer.id+"-"+newVal, null, newVal);}
	 
}
window.onAttributeFieldChange = (el) =>
{ 
	const propName = getPropNameForField(el);
	let newVal = el.value;  let isNumeric=!isNaN(newVal);
	let parPropName = propName;
	if (el.classList.contains("sub-field")) 
	{
		parPropName = getParPropNameForField(el);
		if (!parPropName) {parPropName==propName;}
	}
	// if (refs.dtm.attributeTypeDict.has(parPropName))
	// {
	// 	const atTags=refs.dtm.attributeTypeDict.get(parPropName);
	// 	for (let ti =0; ti < atTags.length; ti++)
	// 	{
	// 		if (atTags[ti+0] == refs.dtm.InputTypeTags.Select) 
	// 		{
	// 			isNumeric=false; if (atTags[ti+1] === "Block") {newVal = refs.dtm.blockData.find(bd=>bd.name==newVal).id;}
	// 			break;
	// 		}
	// 	}
	// }
	if (el.classList.contains("inputTag-Block"))
	{
		isNumeric=false; newVal = refs.dtm.blockData.find(bd=>bd.name==newVal).id;
	}
	
	if (el.type=="checkbox") {newVal = el.checked; isNumeric=false;}
	if (isNumeric) {newVal = parseInt(newVal);}
	console.log("Setting",propName,el.id,"to",newVal);
	getVariableForField(el, newVal, true);
	const obj = getObjectOwningField(el);
	obj.onChangeAttribute();
	// fieldVar = el.value;
	const confContainer = getFieldConfigContainer(el);
	refreshConfigObject(confContainer.childNodes[0].id, confContainer);
	window.onTriggerPreviewUpdate();
}
window.togglePanelCollapse = el=>
{
	const confContainer = getFieldConfigContainer(el.parentElement);
	// console.log("collapsing " + confContainer.id);
	let curHeight = confContainer.getBoundingClientRect().height;
	if (curHeight > 40)
	{
		confContainer.style.height = "26px";
		el.value="▼";
	}
	else
	{
		confContainer.style.height = "250px";
		el.value="▲";
	}
}
window.toggleArrayExpand = btn=>
{
	const arrayFieldEl=btn.parentElement.parentElement;
	// const splitPath = arrayFieldEl.id.split("-");
	arrayFieldEl.classList.toggle("collapsed"); 
	btn.value= arrayFieldEl.classList.contains("collapsed") ? "△" : "▽";
	// const array = getVariableForField(arrayFieldEl);
	
	//outerHTML = createArrayFieldInputs(splitPath[splitPath.length-1], array, backtrackPath(arrayFieldEl.id,splitPath),!arrayFieldEl.classList.contains("collapsed"), );
}
window.onChangeArrayLength = (btn, modifier=null)=>
{
	console.log("changing length");
	const arrayFieldEl=btn.parentElement.parentElement;
	const array = getVariableForField(arrayFieldEl);
	const oldLength = array.length;
	let newLength=oldLength;
	if (!modifier)
	{
		newLength= parseInt(btn.value);
	}
	else
	{
		newLength+=modifier;
	}
	 
	 
	const propName = getPropNameForField(arrayFieldEl);
	const parPropName = getParPropNameForField(arrayFieldEl);
	const steps = getParPropNameForField(arrayFieldEl,true);
	let inputTags = refs.dtm.attributeTypeDict.get(parPropName);
	// console.log("steps:" + steps);
	//if (steps!=0)
	{ 
		// console.log("typeParamsB4:" + inputTags);
		let curStep = 0;
		for (let i = 0; i < inputTags.length; i++)
		{
			if (curStep == steps) {inputTags = inputTags.slice(i,inputTags.length); break;}
			if (inputTags[i] === refs.dtm.InputTypeTags.Vector) {i++;}
			else if (inputTags[i] === refs.dtm.InputTypeTags.Array) {i++;}
			curStep++;
		}
	}
	// console.log("typeParamsAfter:" + inputTags);
	console.log("oldLength: " + oldLength, "newLength: " + newLength);
	
	if (oldLength==newLength) {return;}
	if (oldLength > newLength)
	{
		array.splice(newLength,oldLength);
	}
	else
	{
		let itemToCopy = null; 
		if (oldLength > 0) {itemToCopy=array[oldLength-1];} 
		else
		{
			itemToCopy = getDefaultValofInputTags(inputTags.slice(1,inputTags.length));
			console.log("default val: " + itemToCopy, inputTags.slice(1,inputTags.length));
		}
		for (let i = oldLength; i < newLength; i++)
		{
			if (typeof itemToCopy === "object")
			{
				array.push(refs.dtm.cloneObject(itemToCopy));
			}
			else {array.push(itemToCopy);}
		}
	}
	 
	const confContainer = getFieldConfigContainer(arrayFieldEl);
	console.log("propName:", propName);
	
	let pathPoints = arrayFieldEl.id.split("-"); 
	
	arrayFieldEl.outerHTML = createArrayFieldInputs(propName, array, pathPoints.slice(0,2+steps).join("-"),!arrayFieldEl.classList.contains("collapsed"),  inputTags, false, null, steps>0);
	
	
	
	refreshConfigObject(confContainer.childNodes[0].id, confContainer);
	window.onTriggerPreviewUpdate();
}

function getDefaultValofInputTags(inputTags)
{
	if (inputTags && inputTags.length > 0)
	{
		for (let i = 0; i < inputTags.length; i++)
		{
			if (inputTags[i] === refs.dtm.InputTypeTags.Vector)
			{
				return getDefaultValofVector(inputTags.slice(i+1,inputTags.length));
			}
			else if (inputTags[i] === refs.dtm.InputTypeTags.Array || inputTags[i] === refs.dtm.InputTypeTags.TagsList)
			{
				return getDefaultValofArray(inputTags.slice(i+1,inputTags.length));
			}
		}
	}
	return 0;
}
function getDefaultValofVector(inputTags)
{
	const vectorData = inputTags[0];
	const pkts = vectorData.split("|");
	const vectorSize = parseInt(pkts[0]);
	let axisNames= pkts.length > 0 ? pkts[1].split(",") : null;//labels
	if (!axisNames || axisNames.length <= 1) {axisNames=null;}
	const newTypeParams = inputTags.slice(1,inputTags.length);
	const subTypeParams = pkts.length > 1 && pkts[2] ? pkts[2].split(",") : null;
	const inputAmnt = parseInt(inputTags[0][0]);
	console.log("inputAmnt:",inputAmnt);
	const newVect = new Array(inputAmnt);
	for (let i = 0; i < inputAmnt; i++) 
	{
	 	newVect[i] = getDefaultValofInputTags( subTypeParams ? subTypeParams[Math.min(i,subTypeParams.length-1)].split(".") : newTypeParams);
	} 
	return newVect;
}
function getDefaultValofArray(inputTags)
{
	if (inputTags && inputTags.length>0)
	{
		if (inputTags[0] !== refs.dtm.InputTypeTags.Flex)
		{
			console.log("array size is:" + inputTags[0], "newParams: " + inputTags.slice(1,inputTags.length));
			const arraySize = parseInt(inputTags[0]);
			const newArray = new Array(arraySize);
			for (let i = 0; i < arraySize; i++)
			{
				newArray[i] = getDefaultValofInputTags(inputTags.slice(1,inputTags.length));
			}
			return newArray;
		}
	}
	return [];
} 

function getFieldConfigContainer(el)
{
	let pathPoints = el.id.split("-");
	while (el.id != pathPoints[0] && el.parentElement)
	{
		el = el.parentElement;
	}
	return el;
	
}
function backtrackPath(path, splitPath=null)
{
	if (!splitPath) { splitPath = path.split("-");}
	return splitPath.slice(0,splitPath.length-1).join("-");
}
function getPropNameForField(el)
{
	let pathPoints = el.id.split("-");
	return pathPoints[pathPoints.length-1];
}
function getParPropNameForField(el, getSteps=false)
{
	let pathPoints = el.id.split("-"); let steps=0; 
	for (let i = pathPoints.length-1; i>=0; i--)
	{
		if (refs.dtm.attributeTypeDict.has(pathPoints[i]))
		{
			if (getSteps) {return steps;}
			return pathPoints[i];
		}
		steps+=1;
	}
	return null;
}
function getVariableForField(el, newValue=null, set=false)
{
	let pathPoints = (typeof el === 'string'? el:el.id).split("-");
	let obj = getObjectOwningField(el, pathPoints);
	pathPoints.forEach((pp,i)=>{  
		if (set && i == pathPoints.length-1) {obj[pp]=newValue;}
		obj = obj[pp];
	}); 
	
	return obj;
}
function getObjectOwningField(el, pathPoints=null, returnArray=false)
{
	if (!pathPoints) {pathPoints=el.id.split("-");}
	let obj = null;
	if (pathPoints[0]=="planetCnfg")
	{
		if (returnArray) {return refs.dtm.planets;}
		obj = refs.dtm.planets.find((plnt) => plnt.name==pathPoints[1]); 
		pathPoints.splice(0,2);
	}
	else if (pathPoints[0]=="biomeCnfg")
	{
		if (returnArray) {return refs.dtm.biomeDatas;}
		obj = refs.dtm.biomeDatas.find((biome) => biome.name==pathPoints[1]); 
		pathPoints.splice(0,2);
	}
	else if (pathPoints[0]=="terrainBodyCnfg")
	{
		if (returnArray) {return terrainBodies;}
		obj = terrainBodies.find((tbody) => tbody.name==pathPoints[1]); 
		pathPoints.splice(0,2);
	}
	return obj;
}
function getParentVariableOfField(el)
{
	let pathPoints = el.id.split("-");
	let obj = getObjectOwningField(el, pathPoints);
	if (pathPoints.length < 2) { return obj;}
	pathPoints.forEach((pp,i)=>{
		obj = obj[pp];
		if (i == pathPoints.length-2) {return obj;}
	}); 
	
	return obj;
}

window.switchConfigObject = function(slctEl)
{
	const cnfgContainer = getFieldConfigContainer(slctEl);
	let objName= slctEl.value;
	let newObj=null;
	const objArray = getObjectOwningField(slctEl,null,true);
	if (!objName) {objName="new";}
	else { newObj=objArray.find(obj=>obj.name==objName);}
	const splitPath = slctEl.id.split("-");
	const oldName=splitPath[1];
	let oldObj = objArray.find(obj=>obj.name==oldName);
	if (objName == "new" && objName != oldName)
	{
		// const oldPath = splitPath[0] + "-" + splitPath[1];
		if (!objArray.find(obj=>obj.name=="new"))
		{ 
			newObj = refs.dtm.cloneObject(oldObj);
			newObj.name=objName;newObj.oldName=objName;
			objArray.push(newObj);
			objName=newObj.name;
		}
	}
	// if (oldName=="new" && newObj.name!="new") {newObj.onChangeAttribute();}
	setConfigContainer(cnfgContainer, splitPath[0] + "-" + objName);
	newObj.onSelect();
	if (oldName=="new") { //Remove new object
		let indx = objArray.indexOf(objArray.find(obj=>obj.name==oldName));
		objArray.splice(indx);
	}
}
function setConfigContainer(cnfgContainer, objPath)
{
	cnfgContainer.id = objPath.split("-")[0];
	
	setupConfigObject(cnfgContainer, objPath.split("-")[1])
}



