"use client";
import type { Slide, Lecture } from '../types';
import React from "react";
import {
  Deck,
  Heading,
  SlideLayout,
  Text,
  Image,
} from "spectacle";
import DeckControls from "./DeckControls";

let channel: BroadcastChannel;

export function skipToSlide(slideIndex: number, stepIndex: number = 0) {
  if (!channel) {
    channel = new BroadcastChannel("spectacle_presenter_bus");
  }
  channel.postMessage(
    JSON.stringify({
      type: "SYNC",
      payload: {
        slideIndex,
        stepIndex,
      },
    })
  );
}

export function shutdownSlideshow() {
  if (channel) {
    channel.close();
  }
}

const theme = {
  colors: {
    primary: "black",
    secondary: "purple",
    tertiary: "white",
  },
  backdropStyle: {},
};

const getSafeImageProps = (image?: { src: string; description: string }) => {
  return image ? {
    src: image.src,
    alt: image.description,
    objectFit: 'contain'
  } : {
    src: '',
    alt: 'No image available',
    objectFit: 'contain'
  };
};

export default function Slideshow(props: {
  lecture: Lecture;
  onSlideChange: (slideIndex: number) => void;
}) {
  return (
    <Deck
      theme={theme}
      template={<DeckControls onSlideChange={props.onSlideChange} />}
    >
      {props.lecture.slides.map((slide, index) => (
        <React.Fragment key={index}>
          {slide.template_id === 0 && (
            <SlideLayout.TwoColumn
              key={index}
              left={
                <>
                  <Heading>{slide.title}</Heading>
                  {slide.texts?.slice(0, 3).map((text, idx) => (
                    <Text key={idx}>{text}</Text>
                  ))}
                </>
              }
              right={
                slide.images?.slice(0, 3).map((image, idx) => (
                  <Image
                    key={idx}
                    {...getSafeImageProps(image)}
                  />
                ))
              }
            />
          )}

          {slide.template_id === 1 && (
            <SlideLayout.TwoColumn
              key={index}
              left={
                slide.images?.slice(0, 3).map((image, idx) => (
                  <Image
                    key={idx}
                    {...getSafeImageProps(image)}
                  />
                ))
              }
              right={
                <>
                  <Heading>{slide.title}</Heading>
                  {slide.texts?.slice(0, 3).map((text, idx) => (
                    <Text key={idx}>{text}</Text>
                  ))}
                </>
              }
            />
          )}

          {slide.template_id === 2 && (
            <SlideLayout.Center key={index}>
              <Heading>{slide.title}</Heading>
              {slide.texts?.slice(0, 3).map((text, idx) => (
                <Text key={idx}>{text}</Text>
              ))}
              {slide.images?.[0] && (
                <Image {...getSafeImageProps(slide.images[0])} />
              )}
            </SlideLayout.Center>
          )}

          {slide.template_id === 3 && (
            <SlideLayout.List
              key={index}
              title={slide.title}
              items={slide.texts?.slice(0, 3) || []}
            />
          )}

          {slide.template_id === 4 && (
            <SlideLayout.Section key={index}>
              <Heading>{slide.title}</Heading>
              {slide.texts?.slice(0, 3).map((text, idx) => (
                <Text key={idx}>{text}</Text>
              ))}
            </SlideLayout.Section>
          )}

          {slide.template_id === 5 && (
            <SlideLayout.Statement key={index}>
              <Heading>{slide.title}</Heading>
              {slide.texts?.slice(0, 3).map((text, idx) => (
                <Text key={idx}>{text}</Text>
              ))}
            </SlideLayout.Statement>
          )}

          {slide.template_id === 6 && (
            <SlideLayout.BigFact key={index}>
              <Heading>{slide.title}</Heading>
              {slide.texts?.slice(0, 3).map((text, idx) => (
                <Text key={idx}>{text}</Text>
              ))}
            </SlideLayout.BigFact>
          )}

          {slide.template_id === 7 && (
            <SlideLayout.Quote key={index} attribution="">
              <Heading>{slide.title}</Heading>
              {slide.texts?.slice(0, 3).map((text, idx) => (
                <Text key={idx}>{text}</Text>
              ))}
            </SlideLayout.Quote>
          )}

          {slide.template_id === 8 && slide.images?.[0] && (
            <SlideLayout.HorizontalImage
              key={index}
              {...getSafeImageProps(slide.images[0])}
              title={slide.title}
            />
          )}

          {slide.template_id === 9 && slide.images?.[0] && (
            <SlideLayout.VerticalImage
              key={index}
              {...getSafeImageProps(slide.images[0])}
              listItems={slide.texts?.slice(0, 3) || []}
              title={slide.title}
              titleProps={{ color: "red" }}
            />
          )}

          {slide.template_id === 10 && (
            <SlideLayout.ThreeUpImage
              key={index}
              primary={getSafeImageProps(slide.images?.[0])}
              top={getSafeImageProps(slide.images?.[1])}
              bottom={getSafeImageProps(slide.images?.[2])}
            />
          )}

          {slide.template_id === 11 && slide.images?.[0] && (
            <SlideLayout.FullBleedImage
              key={index}
              {...getSafeImageProps(slide.images[0])}
            />
          )}
        </React.Fragment>
      ))}
    </Deck>
  );
}