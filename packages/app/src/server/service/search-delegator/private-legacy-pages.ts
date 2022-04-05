import mongoose from 'mongoose';

import { PageModel, PageDocument, PageQueryBuilder } from '~/server/models/page';
import { SearchDelegatorName } from '~/interfaces/named-query';
import { IPage } from '~/interfaces/page';
import {
  QueryTerms, MongoTermsKey,
  SearchableData, SearchDelegator, UnavailableTermsKey, MongoQueryTerms,
} from '../../interfaces/search';
import { serializeUserSecurely } from '../../models/serializers/user-serializer';
import { ISearchResult } from '~/interfaces/search';

const AVAILABLE_KEYS = ['match', 'not_match', 'prefix', 'not_prefix'];

class PrivateLegacyPagesDelegator implements SearchDelegator<IPage, MongoTermsKey, MongoQueryTerms> {

  name!: SearchDelegatorName.PRIVATE_LEGACY_PAGES

  constructor() {
    this.name = SearchDelegatorName.PRIVATE_LEGACY_PAGES;
  }

  async search(data: SearchableData<MongoQueryTerms>, user, userGroups, option): Promise<ISearchResult<IPage>> {
    const { terms } = data;
    const { offset, limit } = option;

    if (offset == null || limit == null) {
      throw Error('PrivateLegacyPagesDelegator requires pagination options (offset, limit).');
    }
    if (user == null && userGroups == null) {
      throw Error('Either of user and userGroups must not be null.');
    }

    // find private legacy pages
    const Page = mongoose.model('Page') as unknown as PageModel;
    const { PageQueryBuilder } = Page;

    const countQueryBuilder = new PageQueryBuilder(Page.find());
    await countQueryBuilder.addConditionAsMigratablePages(user);
    const findQueryBuilder = new PageQueryBuilder(Page.find());
    await findQueryBuilder.addConditionAsMigratablePages(user);

    const total = await countQueryBuilder.query.count();

    const _pages: PageDocument[] = await findQueryBuilder
      .addConditionToPagenate(offset, limit)
      .query
      .populate('lastUpdateUser')
      .exec();

    const pages = _pages.map((page) => {
      page.lastUpdateUser = serializeUserSecurely(page.lastUpdateUser);
      return page;
    });

    return {
      data: pages,
      meta: {
        total,
        hitsCount: pages.length,
      },
    };
  }

  addConditionByTerms(builder: PageQueryBuilder, terms: MongoQueryTerms): PageQueryBuilder {
    const {
      match, not_match: notMatch, prefix, not_prefix: notPrefix,
    } = terms;

    if (match.length > 0) {
      match.forEach(m => builder.addConditionToListByMatch(m));
    }
    if (notMatch.length > 0) {
      notMatch.forEach(nm => builder.addConditionToListByNotMatch(nm));
    }
    if (prefix.length > 0) {
      prefix.forEach(p => builder.addConditionToListByStartWith(p));
    }
    if (notPrefix.length > 0) {
      notPrefix.forEach(np => builder.addConditionToListByNotStartWith(np));
    }

    return builder;
  }

  isTermsNormalized(terms: Partial<QueryTerms>): terms is MongoQueryTerms {
    const entries = Object.entries(terms);

    return !entries.some(([key, val]) => !AVAILABLE_KEYS.includes(key) && val.length > 0);
  }

  validateTerms(terms: QueryTerms): UnavailableTermsKey<MongoTermsKey>[] {
    const keys = Object.keys(terms);

    return keys.filter((k): k is UnavailableTermsKey<MongoTermsKey> => !AVAILABLE_KEYS.includes(k));
  }

}

export default PrivateLegacyPagesDelegator;
