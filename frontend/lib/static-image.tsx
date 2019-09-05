import React, { DetailedHTMLProps, ImgHTMLAttributes } from 'react';
import { AppContext } from './app-context';

type ImgProps = DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;

export type StaticImageProps = ImgProps & {
  src: string;
  alt: string;
  dimensions: [number,number];
};

export function StaticImage(props: StaticImageProps): JSX.Element {
  return (
    <AppContext.Consumer>
      {(appCtx) => (
        <img {...props} width={props.dimensions[0]} height={props.dimensions[1]} src={`${appCtx.server.staticURL}${props.src}`} />
      )}
    </AppContext.Consumer>
  );
}
