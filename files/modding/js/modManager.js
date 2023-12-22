const modReader = new FileReader();

modReader.addEventListener("load", (event) => {
	modManager.modToImport=event.target.result;
	$("#importMod").prop("disabled", false);
	$("#importMod").removeClass("disabled");
})

setCharHead = function (headExpression) {
    $('#imageHead').prop("src", "files/img/head_" + headExpression + "_" + strCharName + ".png");
	$('#imageHead').show();
}

var modState = {

}

var modManager = {
    tempMessageStorage: {
        "go": [],
        "stop": [],
        "first": [],
        "finish": [],
        "noCum": []
    },

    editingMod: false,

    editedModName: null,

    enabledMessageMod: null,

    modList: {},

    defaultMessages: null,

    deleteConfrimation: 0,

    goToMainMenu: function () {
        document.getElementById("modMenu").style.display = "none";
        document.getElementById("mainwrapper").style.display = "";
    },

    goToModMenu: function () {
        document.getElementById("modMenu").style.display = "";
        document.getElementById("mainwrapper").style.display = "none";
    },

    addMessageToNewMod: function () {
        let object= {};
        if (document.getElementById("messageInput").value == "") {
            Notification.displayError("Please type a message to be displayed.")
            return;
        }
        object.msg = document.getElementById("messageInput").value
        if (document.getElementById("messageMinTime").value == "" || document.getElementById("messageMinTime").value<0) {
            Notification.displayError("Please add a minimum time. Positive numbers only.")
            return;
        }
        object.minTime = document.getElementById("messageMinTime").value*1
        if (document.getElementById("messageMaxTime").value == "" || document.getElementById("messageMaxTime").value<0 || (document.getElementById("messageMaxTime").value*1)<(document.getElementById("messageMinTime").value*1)) {
            Notification.displayError("Please add a maximum time. Positive numbers only. Must be at least the minimum time.")
            return;
        }
        object.maxTime = document.getElementById("messageMaxTime").value*1
        if (document.getElementById("messageBeatRate").value == "" || document.getElementById("messageBeatRate").value<0) {
            Notification.displayError("Please add a beat rate. Positive numbers only. Recommended values are between 0.1 and 7.")
            return;
        }
        object.beatRate = document.getElementById("messageBeatRate").value*1
        let passType;
        if (document.getElementById("passTypeGo").checked) {
            passType = "go";
        }else if (document.getElementById("passTypeStop").checked) {
            passType = "stop";
        }else if (document.getElementById("passTypeDeny").checked) {
            passType = "noCum";
        }else if (document.getElementById("passTypeFinish").checked) {
            passType = "finish";
        }else if (document.getElementById("passTypeFirst").checked) {
            passType = "first";
        }else {
            Notification.displayError("Please select the message's display step.")
            return;
        }
        modManager.tempMessageStorage[passType].push(object)
        modHTML.createNewModMessage(object, passType);
        return object;
    },
    saveNewMod: function () {
        let passTypeArray = ["Go","Stop","NoCum","Finish","First"];
        if (document.getElementById("newModName").value == "") {
            Notification.displayError("Please enter a name for your mod.")
            return;
        }
        if (typeof modManager.modList[document.getElementById("newModName").value] == "object" && modManager.editedModName != document.getElementById("newModName").value) {
            Notification.displayError("You already have a mod with that name. Please choose a different name.")
            return;
        }
        if (document.getElementById("newModName").value.toUpperCase() == "NEW MOD") {
            Notification.displayError("New Mod is a resvered name. Please choose a different name.")
            return;
        }
        for (let i=0; i<passTypeArray.length; i++) {
            if (document.getElementById("messagePassType"+passTypeArray[i]).childElementCount-1 == 0) {
                Notification.displayError("The mod must have at least one message for every step.");
                return;
            }
        }
        if (modManager.editingMod) {
            delete modManager.modList[modManager.editedModName];
            let parentElement = document.getElementById("existingMods"), childElement;
            for (let i=1; i<parentElement.childElementCount; i++) {
                childElement = parentElement.children[i].children[0].children[0];
                if (childElement.innerText == modManager.editedModName) {
                    parentElement.children[i].remove();
                    break;
                }
            }
        }
        let object = Object.assign({},modManager.tempMessageStorage);
        modManager.modList[document.getElementById("newModName").value] = {type: "message", data: null}
        modManager.modList[document.getElementById("newModName").value].data = object;
        localStorage.setItem('modLedger', JSON.stringify(modManager.modList));
        modHTML.createModElement(document.getElementById("newModName").value)
        Notification.display("Mod Saved")
    },
    deleteMessage: function (array) {
        if (modManager.deleteConfrimation != 1) {
            let popup = new Popup ("Are you sure you want to delete this message?")
            popup.addOption("Confirm", () => {modManager.deleteMessage(array)})
            popup.addOption("Cancel", () => {modManager.deleteConfrimation = 0})
            modManager.deleteConfrimation = 1
            return;
        }else {
            modManager.deleteConfrimation = 0
        }
        let parentElement = document.getElementById("messagePassType"+array[1]), childElements;
        let passType;
        if (array[1] == "Go") {
            passType = "go";
        }else if (array[1] == "Stop") {
            passType = "stop";
        }else if (array[1] == "NoCum") {
            passType = "noCum";
        }else if (array[1] == "Finish") {
            passType = "finish";
        }else if (array[1] == "First") {
            passType = "first";
        }else {
            Notification.displayError("Wrong pass type: modManager.deleteMessage. Recieved: "+array[1]+". Process abandoned.")
            return;
        }
        for (let i=1; i<parentElement.childElementCount; i++) {
            childElements = parentElement.children[i].children[0].children;
            if (childElements[0].innerText == array[0].msg&&childElements[1].innerText == array[0].minTime&&childElements[2].innerText == array[0].maxTime&&childElements[3].innerText == array[0].beatRate) {
                parentElement.children[i].remove();
                break;
            }
        }
        let message;
        for (let i=0; i<modManager.tempMessageStorage[passType].length; i++) {
            message = modManager.tempMessageStorage[passType][i]
            if (message.msg == array[0].msg && message.minTime == array[0].minTime && message.maxTime == array[0].maxTime && message.beatRate == array[0].beatRate) {
                modManager.tempMessageStorage[passType].splice(i,1);
                break;
            }
        }
    },
    deleteMod: function (key) {
        if (modManager.deleteConfrimation != 1) {
            let popup = new Popup ("Are you sure you want to delete this mod?");
            popup.addOption("Confirm", () => {modManager.deleteMod(key)});
            popup.addOption("Cancel", () => {modManager.deleteConfrimation = 0});
            modManager.deleteConfrimation = 1;
            return;
        }else {
            modManager.deleteConfrimation = 0
        }
        if (modManager.enabledMessageMod == key) {
            modManager.enableMod(key);
        }
        let parentElement = document.getElementById("existingMods"), childElements;
        for (let i=1; i<parentElement.childElementCount; i++) {
            childElements = parentElement.children[i].children[0].children;
            if (childElements[0].innerText == key) {
                parentElement.children[i].remove();
                delete modManager.modList[key]
                break;
            }
        }
        localStorage.setItem('modLedger', JSON.stringify(modManager.modList));
    },
    editMod: function (key) {
        let mod = modManager.modList[key]
        let keys = Object.keys(mod.data)
        modHTML.openNewModMenu()
        document.getElementById("newMessageMod").click()
        document.getElementById("newModName").value = key
        modManager.editingMod = true;
        modManager.editedModName = key;
        for (let i=0; i<keys.length; i++) {
            for (let j=0; j<mod.data[keys[i]].length; j++) {
                modHTML.createNewModMessage(mod.data[keys[i]][j], keys[i]);
                modManager.tempMessageStorage[keys[i]].push(mod.data[keys[i]][j])
            }
        }
    },
    enableMod: function (key) {
        if (typeof modManager.modList[key] != "object" && key != null) {
            Notification.displayError("Enabled mod has wrong type or no longer exists. Abandoned loading process.")
            modManager.enabledMessageMod = null;
            localStorage.setItem('enabledMessageMod', JSON.stringify(modManager.enabledMessageMod));
            return;
        }
        let parentElement = document.getElementById("existingMods"), childElement;
        for (let i=1; i<parentElement.childElementCount; i++) {
            childElement = parentElement.children[i].children[0].children[0];
            if (childElement.innerText == key) {
                parentElement.children[i].children[0].children[2].children[0].value = "Disable";
                parentElement.children[i].children[0].children[2].children[0].style.backgroundImage = "linear-gradient(rgb(4, 2, 4) 0px, rgb(61, 21, 100) 100%)";
                break;
            }
        }
        for (let i=1; i<parentElement.childElementCount; i++) {
            childElement = parentElement.children[i].children[0].children[0];
            if (childElement.innerText == modManager.enabledMessageMod) {
                parentElement.children[i].children[0].children[2].children[0].value = "Enable";
                parentElement.children[i].children[0].children[2].children[0].style.backgroundImage = "";
                break;
            }
        }
        if (modManager.enabledMessageMod == null && modManager.defaultMessages == null) {
            modManager.defaultMessages = Object.assign({}, messages)
        }
        if (modManager.enabledMessageMod == key) {
            modManager.enabledMessageMod = null
            messages = Object.assign({}, modManager.defaultMessages)
        }else {
            messages = Object.assign({}, modManager.modList[key].data)
            modManager.enabledMessageMod = key
        }
        localStorage.setItem('enabledMessageMod', JSON.stringify(modManager.enabledMessageMod));
    },
    exportEnabledMod: function () {
        if (modManager.enabledMessageMod == null) {
            Notification.displayWarning("No mod enabled");
            return;
        }
        let file = new File([JSON.stringify(modManager.modList[modManager.enabledMessageMod])], modManager.enabledMessageMod+'.HCM', {
        type: 'text/plain',
        })
        if (file==null) {
            return;
        }
		let link = document.createElement('a')
		let url = URL.createObjectURL(file)
		
		link.href = url
		link.download = file.name
		document.body.appendChild(link)
		link.click()
		
		document.body.removeChild(link)
		window.URL.revokeObjectURL(url)
    },
    importMod: function () {
        let modName = document.getElementById("importModName").value
        if (modName == "") {
            Notification.displayError("Please enter a name for your mod.")
            return;
        }
        if (typeof modManager.modList[modName] == "object") {
            Notification.displayError("You already have a mod with that name. Please choose a different name.")
            return;
        }
        if (modName.toUpperCase() == "NEW MOD") {
            Notification.displayError("New Mod is a resvered name. Please choose a different name.")
            return;
        }
        document.getElementById("importMod").disabled = true
        document.getElementById("importMod").classList.add("disabled")
        modManager.modList[modName] = JSON.parse(modManager.modToImport);
        modManager.modToImport = null;
        document.getElementById("importModName").value = ""
        modHTML.createModElement(modName);
        Notification.display("Imported "+modName+" successfully!");
        localStorage.setItem('modLedger', JSON.stringify(modManager.modList));
    },
    getModData: function (file) {
        try {
			if (file.type && !file.type.startsWith('text/')) {
				return;
			}
			modReader.readAsText(file);
		} catch (error) {
			$("#importMod").prop("disabled", true);
			$("#importMod").addClass("disabled");
			modManager.modToImport=null;
			debugConsole.log(error);
		}
    }
}

var modHTML = {
    initializeModMenu: function () {
        //Create and append the modMenu element
        modMenu = document.createElement("div");
        modMenu.id = "modMenu";
        modMenu.style.display = "none";
        document.body.appendChild(modMenu);
        this.modMenu = modMenu;

        //Create and append the modMenuTitle element
        let tempElement = document.createElement("h2");
        tempElement.id = "modMenuTitle";
        tempElement.innerHTML = "<div style='padding-right: 10px;'><img id='imgLogo' src='files/img/logo.png'/></div>Heat Control<br>[Modded]";
        modMenu.appendChild(tempElement);
        this.modMenuTitle = tempElement;

        this.modMenu.innerHTML+=`
        <div id="modMenuWrapper">
            <div class="form-horizontal" style="width: 80%;height: 300px;margin-left: 10%;margin-right: 10%;">
                <div class="form-group>
                    <div class="modMenuCenter" style="width: 100%;">
                        <div id="existingMods">
                            <span class="horizontalGrouping" style="justify-content: space-around; position: sticky; border: 1px solid darkSeaGreen; top: 0px; background: #101010;z-index: 1;">
                                <div class="modAttribute">Mod Name</div>
                                <div class="modAttribute">Type</div>
                                <div class="modAttribute">Enable Button</div>
                                <div class="modAttribute">Edit Button</div>
                                <div class="modAttribute">Delete Button</div>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <div class="modMenuCenter">
                        <input id="exportEnabledMod" type="button" value="Export Enabled Mod">
                    </div>
                    <div class="modMenuCenter">
                        <label for="importModName">Import as: </label>
                        <input id="importModName" type="text" placeholder="New Mod Name">
                        <input id="importMod" type="button" value="Import Mod" disabled="true" class="disabled">
                        <input id="importModFileSelector" type="file" accept=".HCM">
                    </div>
                </div>
                <div class="form-group" id="modMenuButtonFormGroup">
                    <div class="modMenuCenter">
                        <input id="newMod" type="button" value="Create New Mod">
                    </div>
                    <div class="modMenuCenter">
                        <input id="modMenuToMainMenu" type="button" value="Return to Game">
                    </div>
                </div>
            </div>
        </div>
        <div  id="newModWrapper">
            <div class="form-horizontal" style="width: 60%;">
                <div class="modMenuCenter">
                    <label for="newModName">Mod Name: </label><input id="newModName" type="text" placeholder="Name">
                </div>
                <div class="form-group" id="newModTypeFormGroup">
                    <span class="horizontalGrouping">
                        <label for="newMessageMod">Message</label>
                        <input id="newMessageMod" type="radio" name="newModType" checked="true">
                        <label for="newTrainerMod">Trainer</label>
                        <input id="newTrainerMod" type="radio" name="newModType" disabled="true" class="disabled">
                        <label for="newCombinationMod">Combination</label>
                        <input id="newCombinationMod" type="radio" name="newModType" disabled="true" class="disabled">
                    </span>
                </div>
                <div class="form-group newMessageMod newCombinationMod" id="newModMessageFormGroup">
                    <div class="modMenuCenter" style="width: 100%;">
                        <div id="modMessages">
                            <span class="horizontalGrouping" style="justify-content: space-around; position: sticky; border: 1px solid darkSeaGreen; top: 0px; background: #101010;z-index: 1;">
                                <div class="newModMessageAttribute">Message</div>
                                <div class="newModMessageAttribute">Min Time</div>
                                <div class="newModMessageAttribute">Max Time</div>
                                <div class="newModMessageAttribute">Beat Rate</div>
                                <div class="newModMessageAttribute">Delete Button</div>
                            </span>
                            <div id="messagePassTypeGo">
                                <div class="messagePassTypeLabel" style="position: sticky; top: 32px;">Fap: </div>
                            </div>
                            <div id="messagePassTypeStop">
                                <div class="messagePassTypeLabel" style="position: sticky; top: 32px;">Stop: </div>
                            </div>
                            <div id="messagePassTypeFinish">
                                <div class="messagePassTypeLabel" style="position: sticky; top: 32px;">Cum: </div>
                            </div>
                            <div id="messagePassTypeNoCum">
                                <div class="messagePassTypeLabel" style="position: sticky; top: 31px;">Deny: </div>
                            </div>
                            <div id="messagePassTypeFirst">
                                <div class="messagePassTypeLabel" style="position: sticky; top: 31px;">First Message: </div>
                            </div>
                        </div>
                    </div>
                    <span class="horizontalGrouping">
                        <label for="messageInput">Message Contents:</label>
                        <input id="messageInput" type="text" value="" placeholder="Type message here">
                    </span>
                    <span class="horizontalGrouping">
                        <label for="messageMinTime">Min Time (seconds):</label>
                        <input id="messageMinTime" type="number" value="" min="0">
                    </span>
                    <span class="horizontalGrouping">
                        <label for="messageMaxTime">Max Time (seconds):</label>
                        <input id="messageMaxTime" type="number" value="" min="0">
                    </span>
                    <span class="horizontalGrouping">
                        <label for="messageBeatRate">Beat Rate (beats per second):</label>
                        <input id="messageBeatRate" type="number" value="" min="0.1" step="0.1">
                    </span>
                    <span class="horizontalGrouping">
                        <label for="passTypeGo">Fap</label>
                        <input id="passTypeGo" type="radio" name="Pass Type">
                        <label for="passTypeStop">Stop</label>
                        <input id="passTypeStop" type="radio" name="Pass Type">
                        <label for="passTypeFinish">Cum</label>
                        <input id="passTypeFinish" type="radio" name="Pass Type">
                        <label for="passTypeDeny">Deny</label>
                        <input id="passTypeDeny" type="radio" name="Pass Type">
                        <label for="passTypeFirst">First Message</label>
                        <input id="passTypeFirst" type="radio" name="Pass Type">
                    </span>
                    <div class="modMenuCenter">
                        <input id="addMessage" type="button" value="Add Message">
                    </div>
                </div>
                <div class="modMenuCenter">
                    <input id="saveNewMod" type="button" value="Save Mod">
                </div>
                <div class="modMenuCenter">
                    <input id="exitNewModMenu" type="button" value="Cancel">
                </div>
            </div>
        </div>`

        this.changeDisplay("newMessageMod", "none")
        this.changeDisplay("newTrainerMod", "none")
        this.changeDisplay("newCombinationMod", "none")
        document.getElementById("newModWrapper").style.display = "none"

        //Add elements to the mainGameMenu

        //Replicate the layout of buttons on the main menu
        let tempElement3 = document.createElement("div");
        tempElement3.classList.add("form-group");
        document.getElementById("basicOptionsWrapper").children[document.getElementById("basicOptionsWrapper").childElementCount-2].after(tempElement3);

        let tempElement2 = document.createElement("div");
        tempElement2.classList.add("col-sm-4");
        tempElement3.appendChild(tempElement2);

        tempElement2 = document.createElement("div");
        tempElement2.classList.add("col-sm-8");
        tempElement3.appendChild(tempElement2);

        tempElement3 = document.createElement("input");
        tempElement3.id = "mainMenuToModMenu";
        tempElement3.type = "button";
        tempElement3.value = "Mod Menu";
        tempElement2.appendChild(tempElement3);
    },
    createWrapper: function (id, parentElement) {
        let wrapper = document.createElement("div");
        wrapper.id = id;
        parentElement.appendChild(wrapper);
        return wrapper;
    },
    createFormGroup: function (id, parentElement) {
        let formGroup = document.createElement("div");
        formGroup.classList.add("form-group");
        formGroup.id = id;
        parentElement.appendChild(formGroup);
        return formGroup;
    },
    createCenteringDiv: function (parentElement) {
        let div = document.createElement("div");
        div.classList.add("modMenuCenter");
        parentElement.appendChild(div);
        return div;
    },
    createFormInput: function (id, type, value, parentElement) {
        let input = document.createElement("input");
        input.id = id;
        input.type = type;
        input.value = value;
        parentElement.appendChild(input);
        return input;
    },
    createFormTextinput: function (id, value, placeholder, parentElement) {
        let input = document.createElement("input");
        input.id = id;
        input.type = "text";
        input.value = value;
        input.placeholder = placeholder;
        parentElement.appendChild(input);
        return input;
    },
    createFormRadioInput: function(idArray, valueArray, name, parentElement) {
        let group = document.createElement("div");
        group.classList.add("modRadio");
        parentElement.appendChild(group);
        for (let i = 0; i < idArray.length; i++) {
            let input = document.createElement("input");
            input.id = idArray[i];
            input.type = "radio";
            input.value = valueArray[i];
            input.name = name;
            group.appendChild(input);
            let label = document.createElement("label");
            label.htmlFor = idArray[i];
            label.innerHTML = valueArray[i];
            group.appendChild(label);
        }
    },
    createFormLabel: function (text, parentElement) {
        let label = document.createElement("label");
        label.innerText = text;
        parentElement.appendChild(label)
        return label;
    },
    createHorizontalContainer: function (parentElement) {
        let group = document.createElement("div");
        group.classList.add("horizontalGrouping");
        parentElement.appendChild(group);
        return group;
    },
    createFormHorizontal: function (id, parentElement) {
        let form = document.createElement("form");
        form.classList.add("form-horizontal");
        form.id = id;
        parentElement.appendChild(form);
        return form;
    },
    changeDisplay: function (className, display) {
        let elements = document.getElementsByClassName(className)
        
        for(let i=0; i<elements.length; i++) {
            elements[i].style.display=display;
        }
    },
    newMessageModClick: function () {
        modHTML.changeDisplay("newTrainerMod", "none")
        modHTML.changeDisplay("newCombinationMod", "none")
        modHTML.changeDisplay("newMessageMod", "")
    },
    newTrainerModClick: function () {
        modHTML.changeDisplay("newMessageMod", "none")
        modHTML.changeDisplay("newCombinationMod", "none")
        modHTML.changeDisplay("newTrainerMod", "")
    },
    newCombinationModClick: function () {
        modHTML.changeDisplay("newMessageMod", "none")
        modHTML.changeDisplay("newTrainerMod", "none")
        modHTML.changeDisplay("newCombinationMod", "")
    },
    allClick: function () {
        modHTML.newMessageModClick()
        modHTML.newTrainerModClick()
        modHTML.newCombinationModClick()
    },
    exitNewModMenu: function () {
        document.getElementById("newModWrapper").style.display = "none"
    },
    openNewModMenu: function () {
        document.getElementById("newModWrapper").style.display = ""
        modManager.tempMessageStorage = {
            "go": [],
            "stop": [],
            "first": [],
            "finish": [],
            "noCum": []
        }
        modManager.editingMod = false;
        modManager.editedModName = null;
        document.getElementById("messagePassTypeGo").innerHTML = `<div class="messagePassTypeLabel" style="position: sticky; top: 32px;">Fap: </div>`
        document.getElementById("messagePassTypeStop").innerHTML = `<div class="messagePassTypeLabel" style="position: sticky; top: 32px;">Stop: </div>`
        document.getElementById("messagePassTypeFinish").innerHTML = `<div class="messagePassTypeLabel" style="position: sticky; top: 32px;">Cum: </div>`
        document.getElementById("messagePassTypeNoCum").innerHTML = `<div class="messagePassTypeLabel" style="position: sticky; top: 31px;">Deny: </div>`
        document.getElementById("messagePassTypeFirst").innerHTML = `<div class="messagePassTypeLabel" style="position: sticky; top: 31px;">First Message: </div>`
        document.getElementById("newModName").value = ""
    },
    createNewModMessage: function (message, passType) {
        let span = modHTML.createHorizontalContainer(document.getElementById("messagePassType"+passType.charAt(0).toUpperCase() + passType.slice(1)))
        let element = document.createElement("div");
        element.innerHTML = `<div class="newModMessageAttribute">${message.msg}</div><div class="newModMessageAttribute">${message.minTime}</div><div class="newModMessageAttribute">${message.maxTime}</div><div class="newModMessageAttribute">${message.beatRate}</div>`;
        let deleteButton = document.createElement("input")
        deleteButton.type = "button"
        deleteButton.value = "Delete"
        deleteButton.classList.add("modDeleteButton")
        deleteButton.addEventListener("click",()=>{modManager.deleteMessage([message,passType.charAt(0).toUpperCase() + passType.slice(1)])})
        let divSurroundingButton = document.createElement("div")
        divSurroundingButton.classList.add("newModMessageAttribute")
        divSurroundingButton.appendChild(deleteButton)
        element.appendChild(divSurroundingButton)
        element.classList.add("newModMessage")
        span.appendChild(element)
    },
    createModElement: function (key) {
        let mod = modManager.modList[key]
        let span = modHTML.createHorizontalContainer(document.getElementById("existingMods"))
        let element = document.createElement("div");
        element.innerHTML = `<div class="modAttribute">${key}</div><div class="modAttribute">${mod.type.charAt(0).toUpperCase()+mod.type.slice(1)}</div>`;

        let enableButton = document.createElement("input")
        enableButton.type = "button"
        enableButton.value = "Enable"
        enableButton.classList.add("modEnableButton")
        enableButton.addEventListener("click",()=>{modManager.enableMod(key)})
        let divSurroundingButton = document.createElement("div")
        divSurroundingButton.classList.add("modAttribute")
        divSurroundingButton.appendChild(enableButton)
        element.appendChild(divSurroundingButton)

        let editButton = document.createElement("input")
        editButton.type = "button"
        editButton.value = "Edit"
        editButton.classList.add("modEditButton")
        editButton.addEventListener("click",()=>{modManager.editMod(key)})
        divSurroundingButton = document.createElement("div")
        divSurroundingButton.classList.add("modAttribute")
        divSurroundingButton.appendChild(editButton)
        element.appendChild(divSurroundingButton)

        let deleteButton = document.createElement("input")
        deleteButton.type = "button"
        deleteButton.value = "Delete"
        deleteButton.classList.add("modDeleteButton")
        deleteButton.addEventListener("click",()=>{modManager.deleteMod(key)})
        divSurroundingButton = document.createElement("div")
        divSurroundingButton.classList.add("modAttribute")
        divSurroundingButton.appendChild(deleteButton)
        element.appendChild(divSurroundingButton)
        element.classList.add("existingMod")
        span.appendChild(element)
    }
}

var modMenu;

function initializeModMenuListeners () {
    document.getElementById("modMenuToMainMenu").addEventListener("click", modManager.goToMainMenu);
    document.getElementById("mainMenuToModMenu").addEventListener("click", modManager.goToModMenu);
    document.getElementById("newMessageMod").addEventListener("click", modHTML.newMessageModClick)
    document.getElementById("newTrainerMod").addEventListener("click", modHTML.newTrainerModClick)
    document.getElementById("newCombinationMod").addEventListener("click", modHTML.newCombinationModClick)
    document.getElementById("exitNewModMenu").addEventListener("click", modHTML.exitNewModMenu)
    document.getElementById("newMod").addEventListener("click", modHTML.openNewModMenu)
    document.getElementById("addMessage").addEventListener("click", modManager.addMessageToNewMod)
    document.getElementById("saveNewMod").addEventListener("click", modManager.saveNewMod)
    document.getElementById("exportEnabledMod").addEventListener("click", modManager.exportEnabledMod)
    document.getElementById("importMod").addEventListener("click", modManager.importMod)
    document.getElementById("importModFileSelector").addEventListener("change", (event) => {modManager.getModData(event.target.files[0]);})
    modHTML.allClick()
    
}

function initializeModList() {
    if (localStorage.getItem('modLedger'))
	{
		modManager.modList=JSON.parse(localStorage.getItem('modLedger'));
	}
    let keys = Object.keys(modManager.modList)
    for (let i=0; i<keys.length; i++) {
        modHTML.createModElement(keys[i])
    }
    if (localStorage.getItem('enabledMessageMod'))
	{
		modManager.enableMod(JSON.parse(localStorage.getItem('enabledMessageMod')));
	}
}

window.onload = function () {
    modHTML.initializeModMenu()
    initializeModMenuListeners()
    initializeModList()
}
