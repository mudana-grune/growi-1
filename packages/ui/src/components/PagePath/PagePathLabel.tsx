import React, { FC } from 'react';

import { DevidedPagePath } from '@growi/core';


type TextElemProps = {
  children?: React.ReactNode
  isHTML?: boolean,
}

const TextElement: FC<TextElemProps> = (props: TextElemProps) => (
  <>
    { props.isHTML
      // eslint-disable-next-line react/no-danger
      ? <span dangerouslySetInnerHTML={{ __html: props.children?.toString() || '' }}></span>
      : <>{props.children}</>
    }
  </>
);


type Props = {
  path: string,
  isLatterOnly?: boolean,
  isFormerOnly?: boolean,
  isPathIncludedHtml?: boolean,
  additionalClassNames?: string[],
}

export const PagePathLabel: FC<Props> = (props:Props) => {
  const {
    isLatterOnly, isFormerOnly, isPathIncludedHtml, additionalClassNames, path,
  } = props;

  const dPagePath = new DevidedPagePath(path, false, true);

  const classNames = additionalClassNames || [];

  let textElem;

  if (isLatterOnly) {
    textElem = <TextElement isHTML={isPathIncludedHtml}>{dPagePath.latter}</TextElement>;
  }
  else if (isFormerOnly) {
    textElem = dPagePath.isFormerRoot
      ? <>/</>
      : <TextElement isHTML={isPathIncludedHtml}>{dPagePath.former}</TextElement>;
  }
  else {
    textElem = dPagePath.isRoot
      ? <strong>/</strong>
      : <TextElement isHTML={isPathIncludedHtml}>{dPagePath.former}/<strong>{dPagePath.latter}</strong></TextElement>;
  }

  return <span className={classNames.join(' ')}>{textElem}</span>;
};
