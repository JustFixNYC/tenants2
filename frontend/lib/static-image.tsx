import React, { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import { AppContext } from './app-context';
import { BulmaImageClass } from './bulma';

type ImgProps = DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export type StaticImageProps = ImgProps & {
  src: string;
  alt: string;
  imageRatio: BulmaImageClass;
};

export function StaticImage(props: StaticImageProps): JSX.Element {
  return (
    <AppContext.Consumer>
      {(appCtx) => (
        <figure className={"image " + props.imageRatio}>
          <img {...props} src={`${appCtx.server.staticURL}${props.src}`} />
        </figure>
      )}
    </AppContext.Consumer>
  );
}
