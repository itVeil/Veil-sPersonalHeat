class trainer {
    constructor(name, images, dialogue, flavourText) {
        //String
        this.name = name;
        //Object
        this.images = images;
        //Object
        this.dialogue = dialogue;
        //Array or Object. I haven't decided yet
        this.flavourText = flavourText;
    }
}

var TrainerManager = {
    currentTrainer: null,
    trainerCurrentlyEditing: null,
    trainers: {

    },
    changeName: function(newName) {
        this.trainerCurrentlyEditing.name = newName;
    },
    changeImages: function(newImages) {
        this.trainerCurrentlyEditing.images = newImages;
    },
    changeDialogue: function(newDialogue) {
        this.trainerCurrentlyEditing.dialogue = newDialogue;
    },
    changeFlavourText: function(newFlavourText) {
        this.trainerCurrentlyEditing.flavourText = newFlavourText;
    }
}
