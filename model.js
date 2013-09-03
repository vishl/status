/*global MF Meteor Utils _ Messages*/

//Namespace for model functions
MF = {};

////////////////////////////////// Users ///////////////////////////////////////

//Meteor.users._transform = function(user){
//  console.log("Sendlist for " + user._id + "current user: " + this.userId);
//  console.log(user.sendlist);
//  user.available = user._id===this.userId || _.isArray(user.sendlist) && user.sendlist.indexOf(this.userId)>=0;
//  return user;
//};

MF.userStatus = function(user){
  if(!user){
    return "";
  }
  if(user.profile && user.profile.status){
    return user.profile.status;
  }
  console.log("User does not have status");
  return "";

};

MF.userDisplayName = function(user){
  if(!user){
    return "";
  }

  if(user.profile && user.profile.name){
    return user.profile.name;
  }

  if(user.username){
    return user.username;
  }

  return user._id;
};

MF.userBgColorIndex = function(user){
  if(!user){
    return 0;
  }
  if(user.profile && user.profile.color){
    return user.profile.color || 0;
  }
};

MF.userBgColor = function(user){
  return Utils.colorsA[MF.userBgColorIndex(user)];
};

MF.userColor = function(user){
  return Utils.colorsAAlt[MF.userBgColorIndex(user)];
};

MF.userStatus = function(user){
  if(user && user.profile){
//    return user.profile.status;
    return user.status;
  }

  return "";
};

MF.userStatusTime = function(user){
  if(user && user.profile){
//    return user.profile.statusTime;
    return user.statusTime;
  }

  return null;
};

MF.userStatusTimeDelta = function(user){
  var t = MF.userStatusTime(user);
  if(t){
    var now = (new Date()).getTime();
    var diff = now-t;
    if(diff<60*60*1000){
      return Math.round(diff/(60*1000)) + "m";
    }
    if(diff<60*60*24*1000){
      return Math.round(diff/(60*60*1000)) + "h";
    }
    return Math.round(diff/(60*60*24*1000)) + "d";
  }
  return "";
};

MF.userFriends = function(user){
  if(!user){
    return null;
  }
  return Meteor.users.find({sendList:user._id});
};

MF.userFriendsOfFriends = function(user){
  if(!user){
    return null;
  }
  var friends = MF.userFriends(user);
  var fofIds = {};
  if(!friends){
    return null;
  }
  //find ids of people our friends share with
  friends.forEach(function(friend){
    if(friend.sendList){
      _.each(friend.sendList, function(fofId){
        fofIds[fofId] = 1;
      });
    }
  });


  //delete the ones we are already friends with
  /*
  _.each(user.receiveList, function(f){
    delete fofIds[f];
  });
  */

  //delete users id from list
  delete fofIds[user._id];

  //return users for each remaining id
  return Meteor.users.find({_id:{$in:_.keys(fofIds)}});
};

MF.userGetToken = function(user){
  if(!user){
    return null;
  }
  var token = Utils.genToken();
  if(user.token){
    token = user.token;
  }else{
    //set the token
    Meteor.users.update({_id:user._id}, {$set:{token:token}});
  }
  return token;
};

MF.userTokenLink = function(user){
  return Meteor.absoluteUrl()+"u/" + user.username + '/';// + user.token;
};

////////////////////////////////// Messages ////////////////////////////////////
Messages = new Meteor.Collection("messages");

Messages.allow({
  insert: function (userId, message) {
    //validate
    if(message.fromId === userId && message.aboutId && message.otherId && message.content && ((new Date()).getTime() - message.time)<20000){
      return true;
    }
    return false;

  },
  update: function (userId, message, fields, modifier) {
    return false; //immutable
  },
  remove: function (userId, message) {
    // You can only remove messages where you are the topic
    return message.aboutId === userId;
  }
});


