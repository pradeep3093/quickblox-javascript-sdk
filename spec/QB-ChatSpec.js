var LOGIN_TIMEOUT = 5000;
var MESSAGING_TIMEOUT = 1500;
var REST_REQUESTS_TIMEOUT = 3000;

describe('QuickBlox SDK - Chat module', function() {

  describe('Chat XMPP (real time messaging)', function() {

    // beforeAll
    //
    beforeAll(function(done){

      QB.init(CONFIG.appId, CONFIG.authKey, CONFIG.authSecret);

      QB.chat.connect({userId: QBUser1.id, password: QBUser1.pass}, function(err, roster) {
        if(err){
          done.fail("Chat login error: " + err);
        }else{
          expect(roster).not.toBeNull();
          done();
        }
      });

    }, LOGIN_TIMEOUT);


    // 1-1 mesasging
    //
    it('can send and receive private messages', function(done) {

      var self = this;

      QB.chat.onMessageListener = function(userId, receivedMessage){
        expect(receivedMessage).not.toBeNull();
        expect(receivedMessage.type).toEqual("chat");
        expect(userId).toEqual(QBUser1.id);
        expect(receivedMessage.extension).toEqual({
          param1: "value1",
          param2: "value2"
        });
        expect(receivedMessage.id).toEqual(self.messageId);
        self.messageId = null;

        done();
      };

      var message = {
        type: "chat",
        extension: {
          param1: "value1",
          param2: "value2"
        }
      };
      QB.chat.send(QBUser1.id, message);
      this.messageId = message.id;

    }, MESSAGING_TIMEOUT);


    // System messages
    //
    it('can send and receive system messages', function(done) {

      var self = this;

      QB.chat.onSystemMessageListener = function(receivedMessage){
        expect(receivedMessage).not.toBeNull();
        expect(receivedMessage.userId).toEqual(QBUser1.id);
        expect(receivedMessage.extension).toEqual({
          param1: "value1",
          param2: "value2"
        });
        expect(receivedMessage.id).toEqual(self.messageId);
        self.messageId = null;

        done();
      };

      var message = {
        extension: {
          param1: "value1",
          param2: "value2"
        }
      };
      QB.chat.sendSystemMessage(QBUser1.id, message);
      this.messageId = message.id;

    }, MESSAGING_TIMEOUT);


    // 'Delivered' status
    //
    it("can send and receive 'delivered' status", function(done) {

      var self = this;

      QB.chat.onDeliveredStatusListener = function(messageId, dialogId, userId){
        expect(messageId).toEqual(self.params.messageId);
        expect(dialogId).toEqual(self.params.dialogId);
        expect(userId).toEqual(self.params.userId);
        self.params = null;

        done();
      };

      var params = {
        messageId: "507f1f77bcf86cd799439011",
        userId: QBUser1.id,
        dialogId: "507f191e810c19729de860ea"
      };
      this.params = params;

      QB.chat.sendDeliveredStatus(params);

    }, MESSAGING_TIMEOUT);


    // 'Read' status
    //
    it("can send and receive 'read' status", function(done) {

      var self = this;

      QB.chat.onReadStatusListener = function(messageId, dialogId, userId){
        expect(messageId).toEqual(self.params.messageId);
        expect(dialogId).toEqual(self.params.dialogId);
        expect(userId).toEqual(self.params.userId);
        self.params = null;

        done();
      };

      var params = {
        messageId: "507f1f77bcf86cd799439011",
        userId: QBUser1.id,
        dialogId: "507f191e810c19729de860ea"
      };
      this.params = params;

      QB.chat.sendReadStatus(params);

    }, MESSAGING_TIMEOUT);

  });

  describe('Chat REST API', function() {

    var dialogId;

    // beforeAll
    //
    beforeAll(function(done){

      QB.init(CONFIG.appId, CONFIG.authKey, CONFIG.authSecret);

      QB.createSession({login: QBUser1.login, password: QBUser1.pass},function (err, result){
        if(err){
          done.fail("Creat session error: " + err);
        }else{
          expect(result).not.toBeNull();
          expect(result.application_id).toEqual(CONFIG.appId);
          done();
        }

      });
    }, REST_REQUESTS_TIMEOUT);


    // Dialog create
    //
    it('can create a dialog (group)', function(done) {

      var params = {occupants_ids:[QBUser2.id],
                             name: "GroupDialogName",
                             type: 2
                            }
      QB.chat.dialog.create(params, function(err, res) {

        if(err){
          done.fail("Creat dialog error: " + JSON.stringify(err));
        }else{
          expect(res).not.toBeNull();
          expect(res._id).not.toBeNull();
          expect(res.type).toEqual(2);
          expect(res.name).toEqual("GroupDialogName");
          expect(res.xmpp_room_jid).toMatch('muc.chat.quickblox.com');
          var ocuupantsArray = [QBUser2.id, QBUser1.id].sort(function(a,b){
            return a - b;
          });
          expect(res.occupants_ids).toEqual(ocuupantsArray);

          dialogId = res._id;

          done();
        }

      });
    }, REST_REQUESTS_TIMEOUT);


    // Dialog list
    //
    it('can list dialogs', function(done) {

      var filters = null;
      QB.chat.dialog.list(filters, function(err, res) {

        if(err){
          done.fail("List dialogs error: " + JSON.stringify(err));
        }else{
          expect(res).not.toBeNull();
          expect(res.items.length).toBeGreaterThan(0);
          done();
        }

      });
    }, REST_REQUESTS_TIMEOUT);


    // Dialog update
    //
    it('can update a dialog (group)', function(done) {

      var toUpdate = {
          name: "GroupDialogNewName",
          pull_all: {occupants_ids: [QBUser2.id]}
        };
      QB.chat.dialog.update(dialogId, toUpdate, function(err, res) {

        if(err){
          done.fail("Update dialog " + dialogId +  " error: " + JSON.stringify(err));
        }else{
          expect(res).not.toBeNull();
          expect(res.name).toEqual("GroupDialogNewName");
          expect(res.occupants_ids).toEqual([QBUser1.id]);

          done();
        }

      });
    }, REST_REQUESTS_TIMEOUT);


    // Messages list
    //
    it('can list messages', function(done) {

      var filters = {chat_dialog_id: dialogId};
      QB.chat.message.list(filters, function(err, res) {

        if(err){
          done.fail("List messages error: " + JSON.stringify(err));
        }else{
          expect(res).not.toBeNull();
          // expect(res.items.length).toBeGreaterThan(0);
          done();
        }

      });
    }, REST_REQUESTS_TIMEOUT);


    // Dialog delete
    //
    it('can delete a dialog (group)', function(done) {

      QB.chat.dialog.delete(dialogId, {}, function(err, res) {

        if(err){
          done.fail("Delete dialog " + dialogId +  " error: " + JSON.stringify(err));
        }else{
          done();
        }

      });
    }, REST_REQUESTS_TIMEOUT);

  });
});
