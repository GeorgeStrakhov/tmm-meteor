/*TODO
* make photo uploading nicer with filepicker options and image transformations
* don't allow changing giant's photo if he is also a user
* implement backbone router for url parts handling (sync it with "activeTab"?) and back button behavior - read here: http://stackoverflow.com/questions/13042717/dry-using-handlebars-and-twitter-bootstrap-in-meteor/13055380#13055380
* bootstrap / nicer UI
* search across the system before adding and display suggestion instead of prompt
* add email to meteor.users and email verification through SMTP on via google apps
*/
Giants = new Meteor.Collection("giants");

/*CLIENT*/

if (Meteor.isClient) {

  Meteor.startup(function() {
    filepicker.setKey('AlzKrtCylR8eeNUIgl4zmz'); //setting filepicker
    Session.set("menuItems", [ //setting up the menu
      {name: "Giants", text: "My Giants", isActive: false},
      {name: "Feed", text: "feed", isActive: false},
      {name: "Me", text: "me", isActive: false}
    ]);
    Session.set("activeTab", "Giants");
  });
  
  /*different *reactive* helper functions for the Client start here*/
  
  Meteor.autosubscribe(function () { //this makes shure that "activeTab" and and "menuItems"[i].isActive are in sync
    Meteor.subscribe("activeTab", Session.get("activeTab"));
    newMenuItems = Session.get("menuItems");
    if(newMenuItems) { //in case something is not loaded yet
      for (i=0; i<newMenuItems.length; i++) { //switching the active menu tab here.
        if(newMenuItems[i].name == Session.get("activeTab")) {
          newMenuItems[i].isActive = true;
        } else {
          newMenuItems[i].isActive = false;
        }
      }
      Session.set("menuItems", newMenuItems);
    }
  });
  
  Meteor.autosubscribe(function() { //this selects userGiant if no other giant is selected. ugly but works for now
    Meteor.subscribe("selectedGiant", Session.get("selectedGiant"));
    //console.log(Session.get("selectedGiant"));
    if(!Session.get("selectedGiant"))
      Session.set("selectedGiant", Session.get("userGiant"));
  });
  
  Meteor.autosubscribe(function() { //this changes displaying name to "you" where applicable
  
  });
  
  /* end of *reactive* helper functions */
  
  Template.app.userLogged = function() {
    if (Meteor.user() && Meteor.userLoaded()) {
      var userGiant = Giants.findOne({userId: Meteor.userId()});
      if(!userGiant) { //fresh user, just registaered and we haven't created the corresponding giant yet
        var userEmail = Meteor.user().emails[0].address;
        var newUserGiantId = Giants.insert({name: userEmail, addedBy: Meteor.userId(), userId: Meteor.userId(), myGiants: [], myDwarfs: []}); //creating a corresponding giant for the new user
        Session.set("selectedGiant", Giants.findOne({userId: Meteor.userId()}));
        Session.set("editGiantMode", true);
        Session.set("activeTab", "Me"); //redirecting the fresh user to profile management tab
        userGiant = Giants.findOne(newUserGiantId);
      }
      Session.set("userGiant", userGiant);
      Session.set("selectedGiant", userGiant);
      return true;
    }
  };
  
  Template.mainMenu.items = function() {
    return Session.get("menuItems");
  };
  
  Template.mainMenu.events({
    'click .mainMenuItem' : function() {
      Session.set("editGiantMode", false);
      Session.set("activeTab", this.name);
      if (this.name == "Me")
        Session.set("selectedGiant", Giants.findOne({userId: Meteor.userId()}));
      if (this.name == "Giants")
        Session.set("selectedGiant", Session.get("userGiant"));
    },
  });
  
  Template.myApp.activeTab = function(tab) {
    //console.log(tab);
    //console.log(Session.get("activeTab") == tab);
    return Session.get("activeTab") == tab; //returns true if this is the active tab (tab is passed from the template). read more here: http://docs.meteor.com/#templates
  };
  
  Template.giants.noGiants = function() {
    if(Giants.find({addedBy: Meteor.userId(), userId: { $ne: Meteor.userId() }}).count() === 0)
      return true;
  };
  
  Template.addGiant.editGiantMode = function() {
    return Session.get("editGiantMode");
  };
  
  Template.addGiant.events = ({
    'click #addGiantLink' : function() {
      $(".addGiantForm").toggle();
      $("#newGiantName").focus();
    },
    'click #addGiantButton' : function() {
      if($("#newGiantName").val() == "") {
        alert("please enter name!");
      } else if($("#newGiantName").val() == "you") {
              alert("'you' is a reserved word, please use a different name");
      } else {
        var selectedGiant = Session.get("selectedGiant");
        if(!selectedGiant)
          selectedGiant = Session.get("userGiant");
        //console.log(selectedGiant);
        var newGiantName = $("#newGiantName").val();
        var newGiantId;
        if(Giants.findOne({name: newGiantName})) { //if there is a giant with such name
          //first check if this giant is already standing on him
          var alreadyStanding = false;
          for(i=0; i<selectedGiant.myGiants.length; i++) {
            if(selectedGiant.myGiants[i]._id == Giants.findOne({name: newGiantName})._id)
              alreadyStanding = true;
          }
          if(alreadyStanding) {
            alert("already standing!");
          } else if(Session.get("userGiant")._id == Giants.findOne({name: newGiantName})._id) { //check if I'm trying to add myself
            alert("adding yourself is not allowed!");
          } else {//if not already standing
            //suggest this giant to the user and see if he agrees to adding it
            var yesIWantToAddThisGiant = confirm("Giant "+newGiantName+" already exists in the system. Do you want to add?");
            if(yesIWantToAddThisGiant) {//if he agrees -> proceed to adding. Else - do nothing.
              //first update that giant.myDwarfs
              Giants.update({_id: Giants.findOne({name: newGiantName})._id}, {$push: {myDwarfs: {_id: Session.get("selectedGiant")._id}}});
              //second update selectedGiant.myGiants
              Giants.update({_id: Session.get("selectedGiant")._id},{$push: {myGiants: {_id: Giants.findOne({name: newGiantName})._id}}});
            }
          }
        } else { //no such giant in the DB yet, creating a new one
          newGiantId = Giants.insert({addedBy: Meteor.userId(), myDwarfs: [{_id: selectedGiant._id}], myGiants:[], name: newGiantName}); //create a new giant & don't forget to state that selected Giant is standing on his shoulders
        if(!selectedGiant.myGiants)
          selectedGiant.myGiants=[];
        selectedGiant.myGiants.push({_id: newGiantId});
        Giants.update({_id: selectedGiant._id}, selectedGiant); //update selected giant - push new item into his myGiants array
        }
        if(!(Session.get("selectedGiant") == Session.get("userGiant")))
          Session.set("selectedGiant", Giants.findOne(selectedGiant._id));
      }
    }
  });
  
  Template.singleGiantItem.editGiantMode = function() {
    return Session.get("editGiantMode");
  };
  
  Template.singleGiantItem.itIsMe = function() {
    return this._id == Session.get("userGiant")._id;
  };
  
  Template.singleGiantItem.events = ({
    'click' : function() {
      Session.set("activeTab", "SingleGiant");
      Session.set("selectedGiant", Giants.findOne(this._id));
    }
  });
  
  Template.giants.selectedGiant = function() {
    return Session.get("selectedGiant")
  };
  
  Template.singleGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.singleGiantPage.itsMe = function() {
    return Session.get("selectedGiant")._id == Session.get("userGiant")._id;
  };
  
  Template.singleGiantPage.iAmStandingOnHim = function() {
    var result = false;
    for (i=0; i<Session.get("userGiant").myGiants.length; i++) {
      //console.log(Session.get("userGiant").myGiants[i]);
      if(Session.get("selectedGiant")._id == Session.get("userGiant").myGiants[i]._id)
        result = true;
    }
    return result;
  };
  
  Template.singleGiantPage.myGiantsTab = function() { //if we're on the myGiants tab where we only display the list of giants userGiant is standing on
    return Session.get("activeTab") == "Giants";
  };
  
  Template.singleGiantPage.editGiantMode = function() {
    return Session.get("editGiantMode");
  }
  
  Template.singleGiantPage.events = ({
    'click #editGiantLink' : function() {
      if((Session.get("selectedGiant")._id == Session.get("userGiant")._id) || !(Session.get("selectedGiant").userId)) {//if this giant is me or is not a user 
        Session.set("editGiantMode", true);
      } else {
        alert("sorry, you can't edit this giant's name and description, because he is also a user");
      }
    },
    'click #addToMyGiants' : function() {
      //first update selectedGiant.mydwarfs
      var thisGiantId = Session.get("selectedGiant")._id;
      Giants.update({_id: Session.get("selectedGiant")._id}, {$push : {myDwarfs: {_id: Session.get("userGiant")._id}}});
      //second update userGiant.myGiants
      Giants.update({_id: Session.get("userGiant")._id}, {$push : {myGiants: {_id: Session.get("selectedGiant")._id}}});
      //third make sure that we stay on this giants page despite reactivity wants to take us to userGiant's page
      Meteor.flush();
      Session.set("selectedGiant", Giants.findOne(thisGiantId));
    },
    'click #removeFromMyGiants' : function() {
      //first update selectedGiant.mydwarfs
      var thisGiantId = Session.get("selectedGiant")._id;
      var updatedSelectedGiant = Session.get("selectedGiant");
      var updatedMyDwarfs = [];
      for (i=0; i<updatedSelectedGiant.myDwarfs.length; i++) {
        if(!(updatedSelectedGiant.myDwarfs[i]._id == Session.get("userGiant")._id)) {
          updatedMyDwarfs.push(updatedSelectedGiant.myDwarfs[i]);
        }
      }
      updatedSelectedGiant.myDwarfs = updatedMyDwarfs;
      Giants.update({_id: Session.get("selectedGiant")._id}, updatedSelectedGiant);
      //second update userGiant.myGiants
      var updatedUserGiant = Session.get("userGiant");
      var updatedMyGiants = [];
      for (i=0; i<updatedUserGiant.myGiants.length; i++) {
        if(!(updatedUserGiant.myGiants[i]._id == Session.get("selectedGiant")._id)) {
          updatedMyGiants.push(updatedUserGiant.myGiants[i]);
        }
      }
      updatedUserGiant.myGiants = updatedMyGiants;
      Giants.update({_id: Session.get("userGiant")._id}, updatedUserGiant);
      //third make sure that we stay on this giants page despite reactivity wants to take us to userGiant's page
      Meteor.flush();
      Session.set("selectedGiant", Giants.findOne(thisGiantId));
    }
  });
  
  Template.giantPicture.pictureUrl = function() {
    if(Session.get("selectedGiant").picUrl) {
      return Session.get("selectedGiant").picUrl+"/convert?w=200&h=150&fit=clip"; //utilizing filepicker's image conversions
    } else {
      return "/img/defaultGiant.png";
    }
  };
  
  Template.giantPicture.giant = function() {
    return Session.get("selectedGiant");
  };
  
  Template.isStandingOn.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.isStandingOn.myGiantsTab = function() {
    return Session.get("activeTab") == "Giants";
  };
  
  Template.isStandingOn.myGiants = function() { //we need to define this separately since calling giant.Mygiants inside the template will only give the list of _id back
    var selectedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
    var allHisGiants = [];
    if(selectedGiant.myGiants){
      for (i=0; i<selectedGiant.myGiants.length; i++) {
        if(selectedGiant.myGiants[i]._id){
          allHisGiants.push(Giants.findOne(selectedGiant.myGiants[i]._id));
        }
      }
    }
    //console.log(allHisGiants);
    return allHisGiants;
  };
  
  Template.areStandingOnMe.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };

  Template.areStandingOnMe.myDwarfs = function() {
    var selectedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
    var allHisDwarfs = [];
    for (i=0; i<selectedGiant.myDwarfs.length; i++) {
      allHisDwarfs.push(Giants.findOne(selectedGiant.myDwarfs[i]._id));
    }
    return allHisDwarfs;
  };

  Template.editGiantPage.myGiantPage = function() {
    if(Session.get("selectedGiant")._id == Session.get("userGiant")._id)
      return true;
  };
  
  Template.editGiantPage.giant = function() {
    return Giants.findOne({_id: Session.get("selectedGiant")._id});
  };
  
  Template.editGiantPage.events = ({
    'click #cancelEdit' : function() {
      Session.set("editGiantMode", false);
    },
    'click #uploadNewPicture' : function() {
      filepicker.pick({mimetypes:['image/*']}, function(fpfile) {
        //console.log(fpfile);
        Giants.update({_id: Session.get("selectedGiant")._id},{$set: {picUrl: fpfile.url}});
      });
    },
    'click #saveGiantButton' : function() { //FIX we are saving picture before clicking save button now
      var updatedGiant = Giants.findOne({_id: Session.get("selectedGiant")._id});
      //new name
      if($("#newGiantName").val() == "") {
        alert("name can't be empty!");
      } else if($("#newGiantName").val() == "you") {
         alert("'you' is a reserved word, please use a different name");
      } else if (Giants.findOne({name: $("#newGiantName").val()}) && !(Session.get("selectedGiant")._id == Giants.findOne({name: $("#newGiantName").val()})._id)) { //such a giant already exists and it's not this very one
        alert("giant with this name already exists! please choose another name");
      } else {
        updatedGiant.name = $("#newGiantName").val();
        //new description
        updatedGiant.description = $("#newGiantDescription").val();
        //new connections
          //underconstruction...
        Giants.update({_id: Session.get("selectedGiant")._id}, updatedGiant);
        Session.set("editGiantMode", false);
      }
    }
  });
}

/*SERVER*/

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });  
}
