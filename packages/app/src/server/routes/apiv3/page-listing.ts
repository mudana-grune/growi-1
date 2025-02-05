import express, { Request, Router } from 'express';
import { query, oneOf } from 'express-validator';

import mongoose from 'mongoose';

import { IPageInfoAll, isIPageInfoForEntity, IPageInfoForListing } from '~/interfaces/page';
import loggerFactory from '~/utils/logger';

import { PageModel } from '../../models/page';
import ErrorV3 from '../../models/vo/error-apiv3';
import Crowi from '../../crowi';
import { ApiV3Response } from './interfaces/apiv3-response';
import PageService from '../../service/page';
import { apiV3FormValidator } from '../../middlewares/apiv3-form-validator';
import { IUserHasId } from '~/interfaces/user';

const logger = loggerFactory('growi:routes:apiv3:page-tree');

/*
 * Types & Interfaces
 */
interface AuthorizedRequest extends Request {
  user?: any
}

/*
 * Validators
 */
const validator = {
  pagePathRequired: [
    query('path').isString().withMessage('path is required'),
  ],
  pageIdOrPathRequired: oneOf([
    query('id').isMongoId(),
    query('path').isString(),
  ], 'id or path is required'),
  infoParams: [
    query('pageIds').isArray().withMessage('pageIds is required'),
    query('attachBookmarkCount').isBoolean().optional(),
    query('attachShortBody').isBoolean().optional(),
  ],
};

/*
 * Routes
 */
export default (crowi: Crowi): Router => {
  const accessTokenParser = require('../../middlewares/access-token-parser')(crowi);
  const loginRequired = require('../../middlewares/login-required')(crowi, true);

  const router = express.Router();


  router.get('/root', accessTokenParser, loginRequired, async(req: AuthorizedRequest, res: ApiV3Response) => {
    const Page: PageModel = crowi.model('Page');

    let rootPage;
    try {
      rootPage = await Page.findByPathAndViewer('/', req.user, null, true);
    }
    catch (err) {
      return res.apiv3Err(new ErrorV3('rootPage not found'));
    }

    return res.apiv3({ rootPage });
  });

  // eslint-disable-next-line max-len
  router.get('/ancestors-children', accessTokenParser, loginRequired, ...validator.pagePathRequired, apiV3FormValidator, async(req: AuthorizedRequest, res: ApiV3Response): Promise<any> => {
    const { path } = req.query;

    const Page: PageModel = crowi.model('Page');

    try {
      const ancestorsChildren = await Page.findAncestorsChildrenByPathAndViewer(path as string, req.user);
      return res.apiv3({ ancestorsChildren });
    }
    catch (err) {
      logger.error('Failed to get ancestorsChildren.', err);
      return res.apiv3Err(new ErrorV3('Failed to get ancestorsChildren.'));
    }

  });

  /*
   * In most cases, using id should be prioritized
   */
  // eslint-disable-next-line max-len
  router.get('/children', accessTokenParser, loginRequired, validator.pageIdOrPathRequired, apiV3FormValidator, async(req: AuthorizedRequest, res: ApiV3Response) => {
    const { id, path } = req.query;

    const Page: PageModel = crowi.model('Page');

    try {
      const pages = await Page.findChildrenByParentPathOrIdAndViewer((id || path)as string, req.user);
      return res.apiv3({ children: pages });
    }
    catch (err) {
      logger.error('Error occurred while finding children.', err);
      return res.apiv3Err(new ErrorV3('Error occurred while finding children.'));
    }
  });

  // eslint-disable-next-line max-len
  router.get('/info', accessTokenParser, loginRequired, validator.infoParams, apiV3FormValidator, async(req: AuthorizedRequest, res: ApiV3Response) => {
    const { pageIds, attachBookmarkCount: attachBookmarkCountParam, attachShortBody: attachShortBodyParam } = req.query;

    const attachBookmarkCount: boolean = attachBookmarkCountParam === 'true';
    const attachShortBody: boolean = attachShortBodyParam === 'true';

    const Page = mongoose.model('Page') as unknown as PageModel;
    const Bookmark = crowi.model('Bookmark');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pageService: PageService = crowi.pageService!;

    try {
      const pages = await Page.findByIdsAndViewer(pageIds as string[], req.user, null, true);

      const foundIds = pages.map(page => page._id);

      let shortBodiesMap;
      if (attachShortBody) {
        shortBodiesMap = await pageService.shortBodiesMapByPageIds(foundIds, req.user);
      }

      let bookmarkCountMap;
      if (attachBookmarkCount) {
        bookmarkCountMap = await Bookmark.getPageIdToCountMap(foundIds) as Record<string, number>;
      }

      const idToPageInfoMap: Record<string, IPageInfoAll> = {};

      for (const page of pages) {
        // construct isIPageInfoForListing
        const basicPageInfo = pageService.constructBasicPageInfo(page);

        const pageInfo = (!isIPageInfoForEntity(basicPageInfo))
          ? basicPageInfo
          // create IPageInfoForListing
          : {
            ...basicPageInfo,
            isAbleToDeleteCompletely: pageService.canDeleteCompletely((page.creator as IUserHasId)?._id, req.user, false), // use normal delete config
            bookmarkCount: bookmarkCountMap != null ? bookmarkCountMap[page._id] : undefined,
            revisionShortBody: shortBodiesMap != null ? shortBodiesMap[page._id] : undefined,
          } as IPageInfoForListing;

        idToPageInfoMap[page._id] = pageInfo;
      }

      return res.apiv3(idToPageInfoMap);
    }
    catch (err) {
      logger.error('Error occurred while fetching page informations.', err);
      return res.apiv3Err(new ErrorV3('Error occurred while fetching page informations.'));
    }
  });

  return router;
};
