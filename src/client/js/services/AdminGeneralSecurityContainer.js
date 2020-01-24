import { Container } from 'unstated';

import loggerFactory from '@alias/logger';
import { toastError } from '../util/apiNotification';

// eslint-disable-next-line no-unused-vars
const logger = loggerFactory('growi:security:AdminGeneralSecurityContainer');

/**
 * Service container for admin security page (SecuritySetting.jsx)
 * @extends {Container} unstated Container
 */
export default class AdminGeneralSecurityContainer extends Container {

  constructor(appContainer) {
    super();

    this.appContainer = appContainer;

    this.state = {
      isWikiModeForced: false,
      wikiMode: '',
      currentRestrictGuestMode: 'Deny',
      currentPageCompleteDeletionAuthority: 'adminOnly',
      isHideRestrictedByOwner: false,
      isHideRestrictedByGroup: false,
      useOnlyEnvVarsForSomeOptions: false,
      appSiteUrl: appContainer.config.crowi.url || '',
      isLocalEnabled: false,
      isLdapEnabled: false,
      isSamlEnabled: false,
      isOidcEnabled: false,
      isBasicEnabled: false,
      isGoogleEnabled: false,
      isGitHubEnabled: false,
      isTwitterEnabled: false,
    };

    this.onIsWikiModeForced = this.onIsWikiModeForced.bind(this);
  }

  async retrieveSecurityData() {
    const response = await this.appContainer.apiv3.get('/security-setting/');
    const { generalSetting, generalAuth } = response.data.securityParams;
    this.onIsWikiModeForced(generalSetting.wikiMode);
    this.setState({
      currentPageCompleteDeletionAuthority: generalSetting.pageCompleteDeletionAuthority || 'anyOne',
      isHideRestrictedByOwner: generalSetting.hideRestrictedByOwner || false,
      isHideRestrictedByGroup: generalSetting.hideRestrictedByGroup || false,
      wikiMode: generalSetting.wikiMode || '',
      isLocalEnabled: generalAuth.isLocalEnabled || false,
      isLdapEnabled: generalAuth.isLdapEnabled || false,
      isSamlEnabled: generalAuth.isSamlEnabled || false,
      isOidcEnabled: generalAuth.isOidcEnabled || false,
      isBasicEnabled: generalAuth.isBasicEnabled || false,
      isGoogleEnabled: generalAuth.isGoogleEnabled || false,
      isGitHubEnabled: generalAuth.isGitHubEnabled || false,
      isTwitterEnabled: generalAuth.isTwitterEnabled || false,
    });
  }


  /**
   * Workaround for the mangling in production build to break constructor.name
   */
  static getClassName() {
    return 'AdminGeneralSecurityContainer';
  }

  /**
   * Change restrictGuestMode
   */
  changeRestrictGuestMode(restrictGuestModeLabel) {
    this.setState({ currentRestrictGuestMode: restrictGuestModeLabel });
  }

  /**
   * Change pageCompleteDeletionAuthority
   */
  changePageCompleteDeletionAuthority(pageCompleteDeletionAuthorityLabel) {
    this.setState({ currentPageCompleteDeletionAuthority: pageCompleteDeletionAuthorityLabel });
  }

  /**
   * Switch hideRestrictedByOwner
   */
  switchIsHideRestrictedByOwner() {
    this.setState({ isHideRestrictedByOwner:  !this.state.isHideRestrictedByOwner });
  }

  /**
   * Switch hideRestrictedByGroup
   */
  switchIsHideRestrictedByGroup() {
    this.setState({ isHideRestrictedByGroup:  !this.state.isHideRestrictedByGroup });
  }

  onIsWikiModeForced(wikiModeSetting) {
    if (wikiModeSetting === 'private') {
      this.setState({ isWikiModeForced: true });
    }
    else {
      this.setState({ isWikiModeForced: false });
    }
  }


  /**
   * Update restrictGuestMode
   * @memberOf AdminGeneralSecuritySContainer
   * @return {string} Appearance
   */
  async updateGeneralSecuritySetting() {
    const response = await this.appContainer.apiv3.put('/security-setting/general-setting', {
      restrictGuestMode: this.state.currentRestrictGuestMode,
      pageCompleteDeletionAuthority: this.state.currentPageCompleteDeletionAuthority,
      hideRestrictedByGroup: this.state.isHideRestrictedByGroup,
      hideRestrictedByOwner: this.state.isHideRestrictedByOwner,
    });
    const { securitySettingParams } = response.data;
    return securitySettingParams;
  }

  /**
   * Switch authentication
   */
  async switchAuthentication(stateVariableName, authId) {
    const isEnabled = !this.state[stateVariableName];
    try {
      await this.appContainer.apiv3.put('/security-setting/authentication/enabled', {
        isEnabled,
        authId,
      });
      this.setState({ [stateVariableName]: isEnabled });
    }
    catch (err) {
      toastError(err);
    }
  }

  /**
   * Switch local enabled
   */
  async switchIsLocalEnabled() {
    this.switchAuthentication('isLocalEnabled', 'local');
  }

  /**
   * Switch LDAP enabled
   */
  async switchIsLdapEnabled() {
    this.switchAuthentication('isLdapEnabled', 'ldap');
  }

  /**
   * Switch SAML enabled
   */
  async switchIsSamlEnabled() {
    this.switchAuthentication('isSamlEnabled', 'saml');
  }

  /**
   * Switch Oidc enabled
   */
  async switchIsOidcEnabled() {
    this.switchAuthentication('isOidcEnabled', 'oidc');
  }

  /**
   * Switch Basic enabled
   */
  async switchIsBasicEnabled() {
    this.switchAuthentication('isBasicEnabled', 'basic');
  }

  /**
   * Switch GoogleOAuth enabled
   */
  async switchIsGoogleOAuthEnabled() {
    this.switchAuthentication('isGoogleEnabled', 'google');
  }

  /**
   * Switch GutHubOAuth enabled
   */
  async switchIsGutHubOAuthEnabled() {
    this.switchAuthentication('isGitHubEnabled', 'github');
  }

  /**
   * Switch TwitterOAuth enabled
   */
  async switchIsTwitterOAuthEnabled() {
    this.switchAuthentication('isTwitterEnabled', 'twitter');
  }

}
