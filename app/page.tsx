"use client";

import { useState, useEffect } from "react";
import styles from "./Home.module.css";

type PhoneticData = {
  _id: string;
  label: string;
  text: string;
};

type SectionData = {
  section1: string[];
  section2: string[];
  section3: string[];
};

export default function Home() {
  const [phonetics, setPhonetics] = useState<PhoneticData[]>([]);
  const [currentSectionData, setCurrentSectionData] =
    useState<SectionData | null>(null);
  const [cardsPerRow, setCardsPerRow] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number | null>(0);
  const [glowSection, setGlowSection] = useState<number | null>(0);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [revealedCards, setRevealedCards] = useState<Map<number, string>>(
    new Map()
  );
  const [lastFlippedIndices, setLastFlippedIndices] = useState<number[]>([
    -1, -1, -1,
  ]);

  useEffect(() => {
    const calculateCardsPerRow = () => {
      if (typeof window !== "undefined") {
        const screenWidth = window.innerWidth;
        setIsLargeScreen(screenWidth > 1300);
        // Get the container's horizontal padding and margins
        const container = document.querySelector(`.${styles.mainContainer}`);
        if (container) {
          const containerStyles = window.getComputedStyle(container);
          const containerPaddingLeft = parseFloat(containerStyles.paddingLeft);
          const containerPaddingRight = parseFloat(
            containerStyles.paddingRight
          );
          const containerMarginLeft = parseFloat(containerStyles.marginLeft);
          const containerMarginRight = parseFloat(containerStyles.marginRight);

          const totalHorizontalSpacing =
            containerPaddingLeft +
            containerPaddingRight +
            containerMarginLeft +
            containerMarginRight;
          const availableWidth = screenWidth - totalHorizontalSpacing;
          setCardsPerRow(
            Math.floor(availableWidth / (isLargeScreen ? 83 : 63))
          );
        }
      }
    };

    calculateCardsPerRow();
    window.addEventListener("resize", calculateCardsPerRow);

    return () => window.removeEventListener("resize", calculateCardsPerRow);
  }, [isLargeScreen]);

  useEffect(() => {
    const fetchPhonetics = async () => {
      try {
        const response = await fetch("/api/bopomofo");
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Failed to fetch phonetic data:", errorData.error);
          return;
        }
        const data = await response.json();
        setPhonetics(data.phonetics as PhoneticData[]);
        setGlowSection(0);
      } catch (error) {
        console.error("Failed to fetch phonetic data:", error);
      }
    };

    fetchPhonetics();
  }, []);

  useEffect(() => {
    if (phonetics.length > 0) {
      const numberOfWordsToSelect = 30;
      const shuffled = [...phonetics].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled
        .slice(0, numberOfWordsToSelect)
        .map((item) => item.text);
      setAllWords(selectedWords);
      setFlippedCards(new Set());
      setRevealedCards(new Map());
      setSelectedSection(0);
      setGlowSection(0);
    }
  }, [phonetics]);

  useEffect(() => {
    if (allWords.length > 0 && cardsPerRow > 0) {
      const selectedWord = allWords[currentWordIndex % allWords.length];
      const regex =
        /([ㄭ|ㄅ|ㄆ|ㄇ|ㄈ|ㄉ|ㄊ|ㄋ|ㄌ|ㄍ|ㄎ|ㄏ|ㄐ|ㄑ|ㄒ|ㄓ|ㄔ|ㄕ|ㄖ|ㄗ|ㄘ|ㄙ|ㄧ|ㄨ|ㄩ|ㄚ|ㄛ|ㄜ|ㄝ|ㄞ|ㄟ|ㄠ|ㄡ|ㄢ|ㄣ|ㄤ|ㄥ|ㄦ])([ˇˋˊ˙]?)/g;
      const parts = [];
      let match;

      while ((match = regex.exec(selectedWord)) !== null) {
        parts.push(match[1] + (match[2] || ""));
      }
      if (parts.length === 3) {
        const numberOfCards = cardsPerRow * 2;
        setCurrentSectionData({
          section1: Array(numberOfCards).fill(parts[0]),
          section2: Array(numberOfCards).fill(parts[1]),
          section3: Array(numberOfCards).fill(parts[2]),
        });
      } else {
        console.error(`Word "${selectedWord}" does not have three parts`);
      }
    }
  }, [allWords, cardsPerRow, currentWordIndex]);

  // Flashcard component
  const Flashcard = ({
    letter,
    colorClass,
    sectionIndex,
    index,
    onFlip,
    isFlipped,
  }: {
    letter: string;
    colorClass: string;
    sectionIndex: number;
    index: number;
    onFlip: (sectionIndex: number, cardIndex: number) => void;
    isFlipped: boolean;
  }) => {
    const cardIndex = index + sectionIndex * cardsPerRow * 2;

    const handleFlip = () => {
      if (selectedSection === sectionIndex) {
        onFlip(sectionIndex, index);
      } else {
        alert("Please select a card from the correct section.");
      }
    };
    return (
      <div
        className={`${styles.card} ${isFlipped ? styles.flipped : ""} ${
          lastFlippedIndices[sectionIndex] === index ? styles.glow : ""
        }`}
        onClick={handleFlip}
      >
        <div className={`${styles.cardFront} ${colorClass}`}>
          <span className={styles.letter}></span>
        </div>
        <div
          className={`${styles.cardBack} ${
            isFlipped ? styles.cardBackFlipped : ""
          }`}
        >
          <span className={styles.letter}>
            {revealedCards.get(cardIndex) || letter}
          </span>
        </div>
      </div>
    );
  };

  type SectionProps = {
    letters: string[] | undefined;
    colorClass: string;
    sectionIndex: number;
  };

  const Section: React.FC<SectionProps> = ({
    letters,
    colorClass,
    sectionIndex,
  }) => {
    const handleCardFlip = (sectionIndex: number, cardIndex: number) => {
      const globalIndex = cardIndex + sectionIndex * cardsPerRow * 2;
      setFlippedCards((prev) => {
        const newFlippedCards = new Set(prev);
        if (!newFlippedCards.has(globalIndex)) {
          newFlippedCards.add(globalIndex);
        }
        return newFlippedCards;
      });
      setRevealedCards((prev) => {
        const newRevealedCards = new Map(prev);
        if (!newRevealedCards.has(globalIndex)) {
          newRevealedCards.set(globalIndex, letters ? letters[cardIndex] : "");
        }
        return newRevealedCards;
      });
      setLastFlippedIndices((prev) => {
        const copy = [...prev];
        copy[sectionIndex] = cardIndex;
        return copy;
      });
      setSelectedSection((prevSelectedSection) => {
        if (prevSelectedSection === sectionIndex) {
          return sectionIndex < 2 ? sectionIndex + 1 : 0;
        }
        return prevSelectedSection;
      });
      setGlowSection((prevGlowSection) => {
        if (prevGlowSection === sectionIndex) {
          return sectionIndex < 2 ? sectionIndex + 1 : 0;
        }
        return prevGlowSection;
      });
      if (sectionIndex === 2) {
        setCurrentWordIndex((prevIndex) => prevIndex + 1);
      }
    };

    return (
      <div className={styles.section}>
        <main
          className={styles.cardGrid}
          style={{
            gridTemplateRows: `repeat(2, ${isLargeScreen ? 60 : 55}px)`,
          }}
        >
          {letters?.map((letter, index) => (
            <Flashcard
              key={index}
              letter={letter}
              colorClass={colorClass}
              sectionIndex={sectionIndex}
              index={index}
              onFlip={handleCardFlip}
              isFlipped={flippedCards.has(
                index + sectionIndex * cardsPerRow * 2
              )}
            />
          ))}
        </main>
      </div>
    );
  };

  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>
        注<span className={styles.straight}>ㄓㄨ</span>
        <span className={styles.punctuation}>ˋ</span>
        {"\u00A0"}音<span className={styles.straight}>一ㄣ</span>
        {"\u00A0"}符<span className={styles.straight}>ㄈㄨ</span>
        <span className={styles.punctuation}>ˊ</span>
        {"\u00A0"}號<span className={styles.straight}>ㄏㄠ</span>
        <span className={styles.punctuation}>ˋ</span>
        {"\u00A0"}字<span className={styles.straight}>ㄗ</span>
        <span className={styles.punctuation}>ˋ</span>
        {"\u00A0"}卡<span className={styles.straight}>ㄎㄚ</span>
        <span className={styles.punctuation}>ˇ</span> {"\u00A0"}
        {"\u00A0"}
      </h1>
      <div className={styles.colorTags}>
        <span
          className={`${styles.colorTag} ${styles.redBackground} ${
            glowSection === 0 ? styles.glow : ""
          }`}
        >
          聲<span className={styles.straight}>ㄕㄥ</span>
          {"\u00A0"}符<span className={styles.straight}>ㄈㄨ</span>
          <span className={styles.punctuation}>ˊ</span>
          {"\u00A0"}
        </span>
        <span
          className={`${styles.colorTag} ${styles.greenBackground} ${
            glowSection === 1 ? styles.glow : ""
          }`}
        >
          介<span className={styles.straight}>ㄐ一ㄝ</span>
          <span className={styles.punctuation}>ˋ</span>
          {"\u00A0"}音<span className={styles.straight}>一ㄣ</span>
          {"\u00A0"}
        </span>
        <span
          className={`${styles.colorTag} ${styles.blueBackground} ${
            glowSection === 2 ? styles.glow : ""
          }`}
        >
          韻<span className={styles.straight}>ㄩㄣ</span>
          <span className={styles.punctuation}>ˋ</span>
          {"\u00A0"}符<span className={styles.straight}>ㄈㄨ</span>
          <span className={styles.punctuation}>ˊ</span>
          {"\u00A0"}
        </span>
      </div>
      <Section
        letters={currentSectionData?.section1}
        colorClass={styles.redBackground}
        sectionIndex={0}
      />
      <Section
        letters={currentSectionData?.section2}
        colorClass={styles.greenBackground}
        sectionIndex={1}
      />
      <Section
        letters={currentSectionData?.section3}
        colorClass={styles.blueBackground}
        sectionIndex={2}
      />
    </div>
  );
}
