import React, { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import { AppContext } from './app-context';

type ImgProps = DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export type StaticImageProps = ImgProps & {
  src: string;
  alt: string;
};

export function StaticImage(props: StaticImageProps): JSX.Element {
  return (
    <AppContext.Consumer>
      {(appCtx) => (
        <img {...props} src={`${appCtx.server.staticURL}${props.src}`} />
      )}
    </AppContext.Consumer>
  );
}
