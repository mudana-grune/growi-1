import React from 'react';

import Xss from '~/services/xss';
import loggerFactory from '~/utils/logger';

import GrowiNavbar from '../components/Navbar/GrowiNavbar';
import GrowiNavbarBottom from '../components/Navbar/GrowiNavbarBottom';
import HotkeysManager from '../components/Hotkeys/HotkeysManager';
import PageCreateModal from '../components/PageCreateModal';
import PageDeleteModal from '../components/PageDeleteModal';
import PageDuplicateModal from '../components/PageDuplicateModal';
import PageRenameModal from '../components/PageRenameModal';
import PagePresentationModal from '../components/PagePresentationModal';
import PageAccessoriesModal from '../components/PageAccessoriesModal';
import PutbackPageModal from '~/components/PutbackPageModal';

import AppContainer from '~/client/services/AppContainer';
import SocketIoContainer from '~/client/services/SocketIoContainer';
import { DescendantsPageListModal } from '~/components/DescendantsPageListModal';

const logger = loggerFactory('growi:cli:app');

if (!window) {
  window = {};
}

// setup xss library
const xss = new Xss();
window.xss = xss;

// create unstated container instance
const appContainer = new AppContainer();
// eslint-disable-next-line no-unused-vars
const socketIoContainer = new SocketIoContainer(appContainer);

appContainer.initApp();

logger.info('AppContainer has been initialized');

/**
 * define components
 *  key: id of element
 *  value: React Element
 */
const componentMappings = {
  'grw-navbar': <GrowiNavbar />,
  'grw-navbar-bottom-container': <GrowiNavbarBottom />,

  'page-create-modal': <PageCreateModal />,
  'page-delete-modal': <PageDeleteModal />,
  'page-duplicate-modal': <PageDuplicateModal />,
  'page-rename-modal': <PageRenameModal />,
  'page-presentation-modal': <PagePresentationModal />,
  'page-accessories-modal': <PageAccessoriesModal />,
  'descendants-page-list-modal': <DescendantsPageListModal />,
  'page-put-back-modal': <PutbackPageModal />,

  'grw-hotkeys-manager': <HotkeysManager />,

};

export { appContainer, componentMappings };
