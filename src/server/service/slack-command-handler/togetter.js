const {
  inputBlock, actionsBlock, buttonElement, markdownSectionBlock, divider,
} = require('@growi/slack');
const { parse, format } = require('date-fns');
const axios = require('axios');
const logger = require('@alias/logger')('growi:service:SlackBotService');
const mongoose = require('mongoose');
const { reshapeContentsBody } = require('@growi/slack');

module.exports = (crowi) => {
  const BaseSlackCommandHandler = require('./slack-command-handler');
  const handler = new BaseSlackCommandHandler();

  handler.handleCommand = async function(client, body, args, limit = 10) {
    // TODO GW-6721 Get the time from args
    const result = await client.conversations.history({
      channel: body.channel_id,
      limit,
    });
      // Return Checkbox Message
    client.chat.postEphemeral({
      channel: body.channel_id,
      user: body.user_id,
      text: 'Select messages to use.',
      blocks: this.togetterMessageBlocks(result.messages, body, args, limit),
    });
    return;
  };

  handler.handleBlockActions = async function(client, payload, handlerMethodName) {
    await this[handlerMethodName](client, payload);
  };

  handler.cancel = async function(client, payload) {
    const responseUrl = payload.response_url;
    axios.post(responseUrl, {
      delete_original: true,
    });
  };

  handler.createPage = async function(client, payload) {
    let result = [];
    const channel = payload.channel.id;
    try {
      // validate form
      const { path, oldest, latest } = await this.togetterValidateForm(client, payload);
      // get messages
      result = await this.togetterGetMessages(client, payload, channel, path, latest, oldest);
      // clean messages
      const cleanedContents = await this.togetterCleanMessages(result.messages);

      const contentsBody = cleanedContents.join('');
      // create and send url message
      await this.togetterCreatePageAndSendPreview(client, payload, path, channel, contentsBody);
    }
    catch (err) {
      await client.chat.postMessage({
        channel: payload.user.id,
        text: err.message,
        blocks: [
          markdownSectionBlock(err.message),
        ],
      });
      return;
    }
  };

  handler.togetterValidateForm = async function(client, payload) {
    const grwTzoffset = crowi.appService.getTzoffset() * 60;
    const path = payload.state.values.page_path.page_path.value;
    let oldest = payload.state.values.oldest.oldest.value;
    let latest = payload.state.values.latest.latest.value;
    oldest = oldest.trim();
    latest = latest.trim();
    if (!path) {
      throw new Error('Page path is required.');
    }
    /**
     * RegExp for datetime yyyy/MM/dd-HH:mm
     * @see https://regex101.com/r/dH2Phv/1
     */
    const regexpDatetime = new RegExp(/^[12]\d\d\d\/(0[1-9]|1[012])\/(0[1-9]|[12][0-9]|3[01])-(01[0-9]|2[0123]):[0-5][0-9]$/);

    if (!regexpDatetime.test(oldest)) {
      throw new Error('Datetime format for oldest must be yyyy/MM/dd-HH:mm');
    }
    if (!regexpDatetime.test(latest)) {
      throw new Error('Datetime format for latest must be yyyy/MM/dd-HH:mm');
    }
    oldest = parse(oldest, 'yyyy/MM/dd-HH:mm', new Date()).getTime() / 1000 + grwTzoffset;
    // + 60s in order to include messages between hh:mm.00s and hh:mm.59s
    latest = parse(latest, 'yyyy/MM/dd-HH:mm', new Date()).getTime() / 1000 + grwTzoffset + 60;

    if (oldest > latest) {
      throw new Error('Oldest datetime must be older than the latest date time.');
    }

    return { path, oldest, latest };
  };

  handler.togetterGetMessages = async function(client, payload, channel, path, latest, oldest) {
    const result = await client.conversations.history({
      channel,
      latest,
      oldest,
      limit: 100,
      inclusive: true,
    });

    // return if no message found
    if (!result.messages.length) {
      throw new Error('No message found from togetter command. Try again.');
    }
    return result;
  };

  handler.togetterCleanMessages = async function(messages) {
    const cleanedContents = [];
    let lastMessage = {};
    const grwTzoffset = crowi.appService.getTzoffset() * 60;
    messages
      .sort((a, b) => {
        return a.ts - b.ts;
      })
      .forEach((message) => {
        // increment contentsBody while removing the same headers
        // exclude header
        const lastMessageTs = Math.floor(lastMessage.ts / 60);
        const messageTs = Math.floor(message.ts / 60);
        if (lastMessage.user === message.user && lastMessageTs === messageTs) {
          cleanedContents.push(`${message.text}\n`);
        }
        // include header
        else {
          const ts = (parseInt(message.ts) - grwTzoffset) * 1000;
          const time = format(new Date(ts), 'h:mm a');
          cleanedContents.push(`${message.user}  ${time}\n${message.text}\n`);
          lastMessage = message;
        }
      });
    return cleanedContents;
  };

  handler.togetterCreatePageAndSendPreview = async function(client, payload, path, channel, contentsBody) {
    try {
      await this.MUSTMOVETOUTILcreatePage(client, payload, path, channel, contentsBody);
      // send preview to dm
      await client.chat.postMessage({
        channel: payload.user.id,
        text: 'Preview from togetter command',
        blocks: [
          markdownSectionBlock('*Preview*'),
          divider(),
          markdownSectionBlock(contentsBody),
          divider(),
        ],
      });
      // dismiss message
      const responseUrl = payload.response_url;
      axios.post(responseUrl, {
        delete_original: true,
      });
    }
    catch (err) {
      throw new Error('Error occurred while creating a page.');
    }
  };

  handler.MUSTMOVETOUTILcreatePage = async function(client, payload, path, channelId, contentsBody) {
    const Page = crowi.model('Page');
    const pathUtils = require('growi-commons').pathUtils;
    const reshapedContentsBody = reshapeContentsBody(contentsBody);
    try {
      // sanitize path
      const sanitizedPath = crowi.xss.process(path);
      const normalizedPath = pathUtils.normalizePath(sanitizedPath);

      // generate a dummy id because Operation to create a page needs ObjectId
      const dummyObjectIdOfUser = new mongoose.Types.ObjectId();
      const page = await Page.create(normalizedPath, reshapedContentsBody, dummyObjectIdOfUser, {});

      // Send a message when page creation is complete
      const growiUri = crowi.appService.getSiteUrl();
      await client.chat.postEphemeral({
        channel: channelId,
        user: payload.user.id,
        text: `The page <${decodeURI(`${growiUri}/${page._id} | ${decodeURI(growiUri + normalizedPath)}`)}> has been created.`,
      });
    }
    catch (err) {
      client.chat.postMessage({
        channel: payload.user.id,
        blocks: [
          markdownSectionBlock(`Cannot create new page to existed path\n *Contents* :memo:\n ${reshapedContentsBody}`)],
      });
      logger.error('Failed to create page in GROWI.');
      throw err;
    }
  };

  handler.togetterMessageBlocks = function(messages, body, args, limit) {
    return [
      markdownSectionBlock('Select the oldest and latest datetime of the messages to use.'),
      inputBlock(this.plainTextInputElementWithInitialTime('oldest'), 'oldest', 'Oldest datetime'),
      inputBlock(this.plainTextInputElementWithInitialTime('latest'), 'latest', 'Latest datetime'),
      inputBlock(this.togetterInputBlockElement('page_path', '/'), 'page_path', 'Page path'),
      actionsBlock(
        buttonElement({ text: 'Cancel', actionId: 'togetter:cancel' }),
        buttonElement({ text: 'Create page', actionId: 'togetter:createPage', style: 'primary' }),
      ),
    ];
  };

  /**
   * Plain-text input element
   * https://api.slack.com/reference/block-kit/block-elements#input
   */
  handler.togetterInputBlockElement = function(actionId, placeholderText = 'Write something ...') {
    return {
      type: 'plain_text_input',
      placeholder: {
        type: 'plain_text',
        text: placeholderText,
      },
      action_id: actionId,
    };
  };

  handler.plainTextInputElementWithInitialTime = function(actionId) {
    const tzDateSec = new Date().getTime();
    const grwTzoffset = crowi.appService.getTzoffset() * 60 * 1000;
    const initialDateTime = format(new Date(tzDateSec - grwTzoffset), 'yyyy/MM/dd-HH:mm');
    return {
      type: 'plain_text_input',
      action_id: actionId,
      initial_value: initialDateTime,
    };
  };

  return handler;
};
