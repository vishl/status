/*global Meteor Template Session Utils Accounts _ MF mixpanel Messages*/

////////////////////////////////// Utilities ///////////////////////////////////

//utility to linkify stuff
var linkify = function(content, options){
  options = options || {};
    var regex, m, output, accum, index, newstr, shortened, original, fixed;
//    regex = /(((\w+):\/\/)?([^#\/\s("'<>]+@)?([a-zA-z0-9%\-]+\.)+([a-zA-z0-9%\-]+)([^\s"'<>]*[^.\s"'<>])?)/g;
    regex = /(((\w+):\/\/)([^#\/\s("'<>]+@)?([a-zA-z0-9%\-]+\.)+([a-zA-z0-9%\-]+)([^\s"'<>]*[^.\s"'<>])?)/g;
    m = regex.exec(content);
    output = content;
    accum = 0;
    while(m){
      index = m.index+accum;
      original = m[0];
      //if the whole thing is surrounded by parens, ignore the last paren
      if((content[m.index-1]==="(") && (original[original.length-1]===")")){
        original = original.slice(0,original.length-1);
      }
      //if there is a protocol, leave it, otherwise if there is a user name@ it's an email, otherwise affix http://
      fixed = m[2] ? original : m[4] ? 'mailto:'+original : 'http://'+original;
      if(options.embedImages && fixed.match(/\.(jpg|gif|jpeg|png)$/)){ //TODO other image formats?
        shortened = '<img src="{0}">'.format(fixed);
      }else{
        shortened = m[2]?original.slice(m[2].length):original;  //get rid of protocol
        shortened = shortened.length>30?shortened.slice(0,27)+"...":shortened;
      }
      newstr = '<a href="{0}" target="_blank" title="{0}">{1}</a>'.format(fixed, shortened);
      output = output.slice(0,index)+newstr+output.slice(index+original.length);
      accum += newstr.length-original.length;
      m = regex.exec(content);
    }
    return output;
};

$.fn.linkify = function(options){
  options = options ||{};
  this.each(function(){
    var $t = $(this);
    if(!$t.hasClass('linkified')){
      var linkified = linkify($t.html(), options);
      $t.html(linkified);
      $t.addClass('linkified');
    }
    return this;
  });
  return this;
};

$.fn.pify = function(options){
  options = options ||{};
  this.each(function(){
    var $t = $(this);
    if(!$t.hasClass('pified')){
      var text = $t.html();
      $t.html(text.replace(/\n/g, "<p>"));
      $t.addClass('pified');
    }
    return this;
  });
  return this;
};

////////////////////////////////// Setup ///////////////////////////////////////

Meteor.autosubscribe(function () {
    Meteor.subscribe("userData");
    Meteor.subscribe("allUserData");
    Meteor.subscribe("friendUserData");
    Meteor.subscribe("requesters");
    Meteor.subscribe("messages");
});

Meteor.startup(function () {
  // code to run on server at startup
  Session.set('isLogin', false);
  Session.set('loginError', null);
  Session.set('settingsError', null);
  Session.set('sharingPage', false);

  //only on production
  if(Meteor.absoluteUrl().match("justthestatus.com")){
    mixpanel.init("7c4014912674d99031cbfeaeec88421e");
  }
});

////////////////////////////////// Routes //////////////////////////////////////
Meteor.Router.add({
  '/' : 'statusPage',
  //'/settings' : 'settings',
  '/sharing' : 'sharingPage',
  '/u/:id' : function(id){
    Session.set('destinationUserName', id);
    if(Meteor.user()){
      return 'userPage';
    }else{
      return 'onboarding';
    }
  },
});

Meteor.Router.filters({
  requireLogin: function(page){
    if(Meteor.user()){
      return page;
    }else{
      return 'onboarding';
    }
  }
});

Meteor.Router.filter('requireLogin', {except:'u'}); //all pages

////////////////////////////////// Helper function /////////////////////////////

//log in
Template.page.isLoading = function(){
  return !Accounts.loginServicesConfigured();
};

Template.page.sharingPage = function(){
  return Session.get('sharingPage');
};


//change status
Template.myStatus.created = function(){
  var template = this;
  template.activeField = null;
  console.log("created mystatus");
  console.log($('#mystatus-area').length);
  $('body').on('focus', '#mystatus-area input', function(){
    console.log('Setting active field');
    template.activeField = this;
  });
  $('body').on('blur', '#mystatus-area input', function(){
    if(template.activeField === this){
      console.log('Clearing active field');
      template.activeField = null;
    }
  });
};

Template.myStatus.events({
  'click #update' :function(event, template){
    var status = template.find("#edit-status").value.trim();
    Meteor.users.update({"_id":Meteor.userId()}, {$set:{'status':status, 'statusTime':(new Date()).getTime()}});
    Messages.find({aboutId:Meteor.userId()}, {fields:"_id"}).forEach(function(m){
      Messages.remove({_id:m._id});
    });
    mixpanel.track("Update Status");
    Session.set('edit_status', false);
  },
  'click #edit' : function(e, t){
    Session.set('edit_status', true);
  },
  'click #cancel' :function(e,t){
    Session.set('edit_status', false);
  },
});

Template.myStatus.rendered = function(){
  var self=this;
  $(self.find('#edit-status')).autosize();
  $(self.find('#edit-status')).trigger('autosize');
  $(self.find('.status')).linkify({embedImages:true});
  $(self.find('.status')).pify();
  if(Session.get('edit_status')){
    $(self.find('#edit-status')).focus();
  }

  console.log("rendered mystatus");
  console.log(this.activeField);
  if(this.activeField){
    console.log('focusing active field');
    this.activeField.focus();
  }
};

Template.myStatus.edit = function(){
  return Session.get('edit_status');
};
Template.myStatus.status = function(){
  return MF.userStatus(Meteor.user());
};
Template.myStatus.displayColor = function(){
  return MF.userColor(Meteor.user());
};
Template.myStatus.displayBgColor = function(){
  return MF.userBgColor(Meteor.user());
};
Template.myStatus.displayName = function(){
  return MF.userDisplayName(Meteor.user());
};
Template.myStatus.displayUserName = function(){
  return Meteor.user().username;
};
Template.myStatus.status = function(){
  return MF.userStatus(Meteor.user());
};
Template.myStatus.statusTime =function(){
  return MF.userStatusTimeDelta(Meteor.user());
};

Template.selfchats.messageUser = function(){
//  Messages.distinct('otherId', {aboutId:Meteor.user()._id});
  var all = Messages.find({aboutId:Meteor.user()._id}).fetch();
  var unique = _.uniq(all, false, function(x){return x.otherId;});
  var users = _.map(unique, function(x){return Meteor.users.findOne({_id:x.otherId});});
  console.log(users);
  return users;
};

//this is a user
Template.chatbox.preserve = ['input'];
Template.chatbox.events({
  'submit form':function(e,t){
    e.preventDefault();
    var m = t.find("input").value;
    if(m){
      console.log("Sending message: " + m);
      Messages.insert({
        fromId:Meteor.user()._id,
        toId:this._id,
        aboutId:Meteor.user()._id,
        otherId:this._id,
        content:m,
        time:(new Date()).getTime(),
        unread:true,
      });
    }
    t.find("input").value="";
    Meteor.setTimeout(function(){t.find("input").focus();},0);
    mixpanel.track("Message", {type:'mine'});
  },
});

Template.chatbox.messages = function(){
  return Messages.find({aboutId:Meteor.user()._id, otherId:this._id}, {sort:{time:1}});
};
Template.chatbox.rendered = function(){
  var container = this.find('.messages');
  container.scrollTop = container.scrollHeight;
  console.log("Rendered chatbox " + $(this.find('.chatbox')).data('username'));
};
Template.chatbox.toName = function(){
  return MF.userDisplayName(this);
};

Template.chatbox.toUsername = function(){
  return this.username;
};


Template.message.rendered = function(){
  $(this.find('.content')).linkify({embedImages:true});
};

Template.message.fromName = function(){
  return MF.userDisplayName(Meteor.users.findOne({_id:this.fromId}));
};
Template.message.content = function(){
  return this.content;
};


//friends of current user
Template.friendStatuses.friends = function(){
  var receiveList = Meteor.user().receiveList;
  if(receiveList){
    return Meteor.users.find({$and:[{_id:{$in:receiveList}}, {sendList:Meteor.user()._id}]});
  }
  return null;
};

Template.friendStatuses.created = function(){
  //refresh times regularly
  var template = this;
  template.interval = Meteor.setInterval(function(){
    var node = template.find('table');
    $(node).find('.time').each(function(){
      var username = $(this).data('username');
      var t = Meteor.users.findOne({username:username});
      var tstr = MF.userStatusTimeDelta(t);
      $(this).html(tstr);
    });
  }, 6000);  //every minute
};

Template.friendStatuses.destroyed = function(){
  Meteor.clearInterval(this.interval);
};

Template.friendStatuses.rendered = function(){
  var $container = $(this.find('#friendstatus-area'));
  $container.imagesLoaded(function(){
    $container.masonry({
      itemSelector : '.friendstatus',
    });
    $container.data('initialized', true);
  });
  console.log('refresh all');
};

Template.friendStatus.rendered = function(){
  var username = $(this.find('.username')).data('username');
  //linkify
  $(this.find('.status')).linkify({embedImages:true});
  $(this.find('.tt')).tooltip();

  //this fails on initial render, so put it in a catch block
  var parent = $(this.find('.friendstatus')).parent('#friendstatus-area');
  if(parent.data('initialized')){
    parent.masonry('reload');
  }

  var container = this.find('.messages');
  container.scrollTop = container.scrollHeight;
};

//this is a user
Template.friendStatus.events({
  'submit form':function(e,t){
    e.preventDefault();
    var m = t.find("input").value;
    if(m){
      console.log("Sending message: " + m);
      Messages.insert({
        fromId:Meteor.user()._id,
        toId:this._id,
        aboutId:this._id,
        otherId:Meteor.user()._id,
        content:m,
        time:(new Date()).getTime(),
        unread:true,
      });
    }
    t.find("input").value="";
    t.find("input").focus();
    mixpanel.track("Message", {type:'other'});
  },
});

Template.friendStatus.displayColor = function(){
  return MF.userColor(this);
};

Template.friendStatus.displayBgColor = function(){
  return MF.userBgColor(this);
};

Template.friendStatus.displayName = function(){
  return MF.userDisplayName(this);
};

Template.friendStatus.displayUserName = function(){
  return this.username;
};


Template.friendStatus.status = function(){
  return MF.userStatus(this);
};

Template.friendStatus.statusTime =function(){
  return MF.userStatusTimeDelta(this);
};

Template.friendStatus.messages =function(){
  return Messages.find({aboutId:this._id, otherId:Meteor.user()._id},{sort:{time:1}});
};

Template.findFriendsInner.error = function(){
  return Session.get('findFriendError');
};

Template.findFriendsInner.message = function(){
  return Session.get('findFriendMessage');
};

Template.findFriends.events({
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
        console.log(error);
        console.log(result);
        if(error){
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

Template.findFriendsInner.myUrl = function(){
  if(Meteor.user()){
    return Meteor.absoluteUrl()+"u/" + Meteor.user().username;
  }
  return "";
};

Template.friendRequests.frCount = function(){
  return Meteor.user() && Meteor.user().requestList ? Meteor.user().requestList.length : 0;
};

Template.friendRequests.requests = function(){
  return Meteor.users.find({_id:{$in:Meteor.user().requestList}});
};

Template.friendRequest.events({
  'click label' : function(e,t){
    e.stopPropagation();
  },
  'click #approve' : function(e,t){
    e.stopPropagation();
    var followback = $(t.find('input')).prop('checked');
    Meteor.call('approveFollow', this._id, followback, function(error, result){
      if(!error){
        mixpanel.track("Approve follow");
      }
    });
  },
  'click #reject' : function(e,t){
    e.stopPropagation();
    var followback = $(t.find('input')).prop('checked');
    Meteor.call('rejectFollow', this._id, followback, function(error, result){
      if(!error){
        mixpanel.track("Reject follow");
      }
    });
  },
});

Template.friendRequest.userName = function(){
  return MF.userDisplayName(this);
};

Template.footer.events({
  'click #uservoice' : function(e, t){
    e.preventDefault();

    var userVoice = window.UserVoice || [];
    userVoice.push(['showLightbox', 'classic_widget', {
      mode: 'full',
      primary_color: '#cc6d00',
      link_color: '#007dbf',
      default_mode: 'feedback',
      forum_id: 210203
    }]);
  },
});

Template.friendLink.link = function(){
  return Meteor.absoluteUrl()+"u/" + Meteor.user().username;
};
