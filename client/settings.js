/*global Meteor Template Session Utils Accounts _ MF mixpanel*/

Template.settings.events({
  'click #cancel' : function(e, t){
    $(t.find('.modal')).modal('hide');
  },

  'submit form' : function(e, t){
    e.preventDefault();
    var name = _.str.trim(t.find('#name').value);
    if(!Utils.validateName(name)){
      Session.set('settingsError', 'Please enter a valid name');
    }else{
      //update
      Meteor.users.update({_id:Meteor.user()._id}, {$set:{'profile.name':name, 'profile.color':Session.get('userColorTemp')}}, function(err){
        if(err){
          Session.set('settingsError', 'Server error');
          console.log(err);
        }else{
          $(t.find('.modal')).modal('hide');
          Session.set('userColorTemp', null);
        }
      });
    }
  },

  'click .color' : function(e,t){
    var index = $(e.currentTarget).data('index');
    Session.set('userColorTemp', index);
    console.log('setting color ' + index);
  },
});

Template.settingsInner.error = function(){
  return Session.get('settingsError');
};

Template.settingsInner.displayName = function(){
  var u = Meteor.user();
  if (u && u.profile){
    return u.profile.name;
  }
  return "";
};

Template.settingsInner.username = function(){
  var u = Meteor.user();
  if (u){
    return u.username;
  }
  return "";
};

Template.settingsInner.email = function(){
  var u = Meteor.user();
  if (u && u.emails && u.emails.length){
    return u.emails[0].address;
  }
  return "";
};

Template.settingsInner.userbgcolor = function(){
  var c = Session.get('userColorTemp');
  if(!_.isNumber(c)){
    c = Meteor.user() && Meteor.user().profile && Meteor.user().profile.color;
  }
  if(!c){
    c=0;
  }
  return Utils.colorsA[c];
};

Template.settingsInner.usercolor = function(){
  var c = Session.get('userColorTemp');
  if(!_.isNumber(c)){
    c = Meteor.user() && Meteor.user().profile.color;
  }
  if(!c){
    c=0;
  }
  return Utils.colorsAAlt[c];
};

Template.colorpicker.colors = function(){
  var i =0;
  return _.map(Utils.colorsA, function(x){return i++;});
};

Template.colorpicker.color = function(){
  return Utils.colorsA[this];
};

Template.colorpicker.index = function(){
  return parseInt(this, 10);
};

Template.sharingPage.receiveList = function(){
  var user = Meteor.user();
  if(user && user.receiveList){
    return Meteor.users.find({_id:{$in:user.receiveList}});
  }
  return null;
};

Template.sharingPage.sendList = function(){
  var user = Meteor.user();
  if(user && user.sendList){
    return Meteor.users.find({_id:{$in:user.sendList}});
  }
  return null;
};

Template.shareitem.events({
  'click .close' : function(e,t){
    e.preventDefault();
    var id = $(t.find('.close')).data('id');
    var user = Meteor.users.findOne({_id:id});
    var node = $(t.firstNode);
    var isSendList = !!node.parents('#sendlist').length;
    if(isSendList){
      if(window.confirm("Are you sure you want to block " + MF.userDisplayName(user) + " from seeing your status?")){
        console.log("Removing " + id + "from send list");
        Meteor.call('removeFromSendList', id);
      }
    }else{
      if(window.confirm("Are you sure you want to remove " + MF.userDisplayName(user) + " from your page? They will still be able to see your status if you have allowed them to.")){
        console.log("Removing " + id + "from receive list");
        Meteor.call('removeFromReceiveList', id);
      }
    }

  }
});
Template.shareitem.displayName = function(){
  return MF.userDisplayName(this);
};

Template.shareitem.username = function(){
  return this && this.username;
};
Template.shareitem.id = function(){
  return this && this._id;
};
