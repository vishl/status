/*global Meteor Template Session Utils Accounts _ MF mixpanel Messages*/


Template.findFriendsInner.events({
  'click #cancel' : function(e,t){
    $(t.find('.modal')).modal('hide');
  },

  'submit form' : function(e,t){
    e.preventDefault();
    var q = t.find('#query').value;
    var followback = $(t.find('#followback')).prop('checked');
    if(Utils.validateEmail(q)){
      //it's an email, need to do an rpc
      Meteor.call('followByEmail', q, followback, function(error, result){
        if(error){
          console.log(error);
          console.log(result);
          var e = error.reason? error.reason : 'There was an error';
          Session.set('findFriendError', e);
        }else{
          if(result){
            Session.set('findFriendError', null);
            Session.set('findFriendMessage', 'We sent a request to ' + MF.userDisplayName(result));
            $(t.find('#query')).val('');
            mixpanel.track("Friend request", {type:'email'});
          }else{
            Session.set('findFriendMessage', null);
            Session.set('findFriendError', 'Could not find anyone with that email address');
          }
        }
      });
    }else{
      //search by username
      Meteor.call('followByUsername', q, followback, function(error, result){
        if(error){
          var e = error.reason? error.reason : 'There was an error';
          Session.set('findFriendError', e);
        }else{
          if(result){
            Session.set('findFriendError', null);
            Session.set('findFriendMessage', 'We sent a request to ' + MF.userDisplayName(result));
            $(t.find('#query')).val('');
            mixpanel.track("Friend request", {type:'username'});
          }else{
            Session.set('findFriendMessage', null);
            Session.set('findFriendError', 'Could not find anyone with that username');
          }
        }
      });
    }
  },
});

Template.findFriendsInner.error = function(){
  return Session.get('findFriendError');
};

Template.findFriendsInner.message = function(){
  return Session.get('findFriendMessage');
};

Template.findFriendsInner.myUrl = function(){
  if(Meteor.user()){
    return Meteor.absoluteUrl()+"u/" + Meteor.user().username;
  }
  return "";
};

Template.findFriendsInner.fof = function(){
  return MF.userFriendsOfFriends(Meteor.user());
};


Template.suggestFriend.events({
  'click .follow-button' : function(e,t){
    var followback = $(t.find('#followback')).prop('checked');
    var username = $(t.find('.follow-button')).data('username');
    Meteor.call('followByUsername', username, followback, function(error, result){
      if(error){
        console.log(error);
      }else{
        mixpanel.track("Friend request", {type:'suggested'});
      }
    });
  },
});

Template.suggestFriend.userDisplayName = function(){
  return MF.userDisplayName(this);
};
Template.suggestFriend.userName = function(){
  return this.username;
};

Template.suggestFriend.followed = function(){
  return Meteor.user() && (Meteor.user().receiveList.indexOf(this._id)>=0);
};

Template.findFriendsBox.fof = function(){
  var ret = [];
  _.each(MF.userFriendsOfFriends(Meteor.user()).fetch(), function(f){
    if(f && f.sendList){
      if(ret.length<3 && f.sendList.indexOf(Meteor.user()._id)<0){
        ret.push(f);
      }
    }
  });
  return ret;
};

Template.miniFriend.userDisplayName = function(){
  return MF.userDisplayName(this);
};
