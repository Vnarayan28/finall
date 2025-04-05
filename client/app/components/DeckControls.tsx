import { useContext, useEffect } from "react";
import { DeckContext, DefaultTemplate } from "spectacle";

interface DeckControlsProps {
  onSlideChange: (slideIndex: number) => void;
}

export default function DeckControls({ onSlideChange }: DeckControlsProps) {
  const {
    activeView: { slideIndex },
  } = useContext(DeckContext);

  useEffect(() => {
    onSlideChange(slideIndex);
  }, [slideIndex, onSlideChange]);

  return <DefaultTemplate color="purple" />;
}