import React, { FC } from 'react';

import { Modal, ModalHeader, ModalBody } from 'reactstrap';
import { pathUtils } from 'growi-commons';
import { useTranslation } from '~/i18n';

// import { withTranslation } from 'react-i18next';
// import urljoin from 'url-join';
// import { withUnstatedContainers } from './UnstatedUtils';

// import PageContainer from '../services/PageContainer';

type Props = {
  isOpen: boolean;
  onClose:() => void;
  path: string;
}

// TODO-5054 impl modal
export const CreateTemplateModal:FC<Props> = (props:Props) => {
  const { t } = useTranslation();
  const parentPath = pathUtils.addTrailingSlash(props.path);

  return (
    <Modal size="lg" isOpen={props.isOpen} toggle={props.onClose} autoFocus={false}>
      <ModalHeader tag="h4" toggle={props.onClose} className="bg-primary text-light">
        {t('template.modal_label.Create/Edit Template Page')}
      </ModalHeader>
      <ModalBody>
        <div className="form-group">
          <label className="mb-4">
            <code>{parentPath}</code><br />
            { t('template.modal_label.Create template under') }
          </label>
          <div className="card-deck">
            {/* {renderTemplateCard('children', '_template')}
            {renderTemplateCard('decendants', '__template')} */}
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
};

const DeprecatedCreateTemplateModal = (props) => {
  const { t, pageContainer } = props;

  const { path } = pageContainer.state;
  const parentPath = pathUtils.addTrailingSlash(path);

  function generateUrl(label) {
    return encodeURI(urljoin(parentPath, label, '#edit'));
  }

  /**
   * @param {string} target Which hierarchy to create [children, decendants]
   */
  function renderTemplateCard(target, label) {
    return (
      <div className="card card-select-template">
        <div className="card-header">{ t(`template.${target}.label`) }</div>
        <div className="card-body">
          <p className="text-center"><code>{label}</code></p>
          <p className="form-text text-muted text-center"><small>{t(`template.${target}.desc`) }</small></p>
        </div>
        <div className="card-footer text-center">
          <a
            href={generateUrl(label)}
            className="btn btn-sm btn-primary"
            id={`template-button-${target}`}
          >
            { t('Edit') }
          </a>
        </div>
      </div>
    );
  }

  return (
    <Modal isOpen={props.isOpen} toggle={props.onClose} className="grw-create-page">
      <ModalHeader tag="h4" toggle={props.onClose} className="bg-primary text-light">
        {t('template.modal_label.Create/Edit Template Page')}
      </ModalHeader>
      <ModalBody>
        <div className="form-group">
          <label className="mb-4">
            <code>{parentPath}</code><br />
            { t('template.modal_label.Create template under') }
          </label>
          <div className="card-deck">
            {renderTemplateCard('children', '_template')}
            {renderTemplateCard('decendants', '__template')}
          </div>
        </div>
      </ModalBody>
    </Modal>

  );
};


/**
 * Wrapper component for using unstated
 */
// const CreateTemplateModalWrapper = withUnstatedContainers(CreateTemplateModal, [PageContainer]);


// CreateTemplateModal.propTypes = {
//   t: PropTypes.func.isRequired, //  i18next
//   pageContainer: PropTypes.instanceOf(PageContainer).isRequired,

//   isOpen: PropTypes.bool.isRequired,
//   onClose: PropTypes.func.isRequired,
// };

// export default withTranslation()(CreateTemplateModalWrapper);
