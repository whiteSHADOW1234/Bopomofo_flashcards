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

const SECTION1_CHARS = new Set(['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ', 'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ', 'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ']);
const SECTION2_CHARS = new Set(['ㄧ', 'ㄨ', 'ㄩ']);
const SECTION3_CHARS = new Set(['ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ', 'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ']);

export default function Home() {
  const [phonetics, setPhonetics] = useState<PhoneticData[]>([]);
  const [currentSectionData, setCurrentSectionData] = useState<SectionData | null>(null);
  const [cardsPerRow, setCardsPerRow] = useState(0);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<number | null>(0);
  const [glowSection, setGlowSection] = useState<number | null>(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [allWords, setAllWords] = useState<string[]>([]);
  const [revealedCards, setRevealedCards] = useState<Map<number, string>>(new Map());
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [isRoundComplete, setIsRoundComplete] = useState(false);

  useEffect(() => {
    const calculateCardsPerRow = () => {
      if (typeof window !== "undefined") {
        const screenWidth = window.innerWidth;
        setIsLargeScreen(screenWidth > 1300);
        const container = document.querySelector(`.${styles.mainContainer}`);
        if (container) {
          const containerStyles = window.getComputedStyle(container);
          const containerPaddingLeft = parseFloat(containerStyles.paddingLeft);
          const containerPaddingRight = parseFloat(containerStyles.paddingRight);
          const containerMarginLeft = parseFloat(containerStyles.marginLeft);
          const containerMarginRight = parseFloat(containerStyles.marginRight);

          const totalHorizontalSpacing =
            containerPaddingLeft +
            containerPaddingRight +
            containerMarginLeft +
            containerMarginRight;
          const availableWidth = screenWidth - totalHorizontalSpacing;
          setCardsPerRow(Math.floor(availableWidth / (isLargeScreen ? 83 : 63)));
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
      resetGame(selectedWords);
    }
  }, [phonetics]);

  const resetGame = (words: string[]) => {
    setAllWords(words);
    setRevealedCards(new Map());
    setFlippedCards(new Set());
    setSelectedSection(0);
    setGlowSection(0);
    setActiveCard(null);
    setIsRoundComplete(false);
  };

  const parsePhoneticPart = (character: string): { base: string, tone: string } => {
    const toneMatch = character.match(/([^ˇˋˊ˙])(ˇ|ˋ|ˊ|˙)?/);
    if (toneMatch) {
      return {
        base: toneMatch[1] || '',
        tone: toneMatch[2] || ''
      };
    }
    return { base: character, tone: '' };
  };


  const validateAndAssignParts = (word: string): [string, string, string] => {
    const regex = /([ㄭ|ㄅ|ㄆ|ㄇ|ㄈ|ㄉ|ㄊ|ㄋ|ㄌ|ㄍ|ㄎ|ㄏ|ㄐ|ㄑ|ㄒ|ㄓ|ㄔ|ㄕ|ㄖ|ㄗ|ㄘ|ㄙ|ㄧ|ㄨ|ㄩ|ㄚ|ㄛ|ㄜ|ㄝ|ㄞ|ㄟ|ㄠ|ㄡ|ㄢ|ㄣ|ㄤ|ㄥ|ㄦ])([ˇˋˊ˙]?)/g;
    const parts = word.match(regex) || [];
    let section1 = ' ', section2 = ' ', section3 = ' ';

    parts.forEach(part => {
      const { base, tone } = parsePhoneticPart(part);
      if (SECTION1_CHARS.has(base)) {
        section1 = part;
      } else if (SECTION2_CHARS.has(base)) {
        section2 = part;
      } else if (SECTION3_CHARS.has(base)) {
        section3 = part;
      }
    });

    return [section1, section2, section3];
  };

  useEffect(() => {
    if (allWords.length > 0 && cardsPerRow > 0) {
      const selectedWord = allWords[currentWordIndex % allWords.length];
      const [part1, part2, part3] = validateAndAssignParts(selectedWord);
      
      const numberOfCards = cardsPerRow * 2;
      setCurrentSectionData({
        section1: Array(numberOfCards).fill(part1),
        section2: Array(numberOfCards).fill(part2),
        section3: Array(numberOfCards).fill(part3),
      });
    }
  }, [allWords, cardsPerRow, currentWordIndex]);

  const Flashcard = ({
    letter,
    colorClass,
    sectionIndex,
    index,
    onFlip,
  }: {
    letter: string;
    colorClass: string;
    sectionIndex: number;
    index: number;
    onFlip: (sectionIndex: number, cardIndex: number) => void;
  }) => {
    const cardIndex = index + sectionIndex * cardsPerRow * 2;
    const isFlipped = flippedCards.has(cardIndex);
    const isActive = activeCard === cardIndex;
    const [isFlippedInternal, setIsFlippedInternal] = useState(false);

    useEffect(() => {

      // wait 50ms before flipping the card
      setTimeout(() => {
        if (flippedCards.has(cardIndex)) {
          setIsFlippedInternal(true);
        } else {
          setIsFlippedInternal(false);
        }
      }, 50);
      
      if (flippedCards.has(cardIndex)) {
        setIsFlippedInternal(true);
      } else {
        setIsFlippedInternal(false);
      }

    }, [flippedCards, cardIndex])

    const renderLetter = (char: string) => {
      if (!char || char.trim() === '') return '';
      const { base } = parsePhoneticPart(char);
      if (base === 'ㄧ') {
        return <span className={styles.rotatedSymbol}>{char}</span>;
      }
      return char;
    };

    const handleFlip = () => {
      if (sectionIndex === 0 && isRoundComplete) {
        resetGame(allWords);
        setTimeout(() => {
          onFlip(sectionIndex, index);
        }, 50);
      } else if (selectedSection === sectionIndex && !isFlipped) {
        onFlip(sectionIndex, index);
      } else if (selectedSection !== sectionIndex) {
        alert("Please select a card from the correct section.");
      }
    };

    return (
      <div
        className={`${styles.card} ${
          isFlippedInternal ? (isActive ? styles.flipped : styles.flippedNoAnimation) : ""
        } ${
          isActive ? styles.glow : ""
        }`}
        onClick={handleFlip}
      >
        <div className={`${styles.cardFront} ${colorClass}`}>
          <span className={styles.letter}></span>
        </div>
        <div className={`${styles.cardBack}`}>
          <span className={styles.letter}>{revealedCards.get(cardIndex) ? renderLetter(revealedCards.get(cardIndex)!) : renderLetter(letter)}</span>
        </div>
      </div>
    );
  };

  type SectionProps = {
    letters: string[] | undefined;
    colorClass: string;
    sectionIndex: number;
  };

  const Section: React.FC<SectionProps> = ({ letters, colorClass, sectionIndex }) => {
    const handleCardFlip = (sectionIndex: number, cardIndex: number) => {
      const globalIndex = cardIndex + sectionIndex * cardsPerRow * 2;

      // Update revealed cards
      setRevealedCards((prev) => {
        const newRevealedCards = new Map(prev);
        newRevealedCards.set(globalIndex, letters ? letters[cardIndex] : "");
        return newRevealedCards;
      });

      // Update flipped cards state with animation
      setFlippedCards((prev) => {
        const newFlippedCards = new Set(prev);
        newFlippedCards.add(globalIndex);
        return newFlippedCards;
      });

      // Set active card for glow effect
      setActiveCard(globalIndex);

      // Update section selection
      setSelectedSection((prevSelectedSection) => {
        if (prevSelectedSection === sectionIndex) {
          return sectionIndex < 2 ? sectionIndex + 1 : 0;
        }
        return prevSelectedSection;
      });

      // Update glow section
      setGlowSection((prevGlowSection) => {
        if (prevGlowSection === sectionIndex) {
          return sectionIndex < 2 ? sectionIndex + 1 : 0;
        }
        return prevGlowSection;
      });

      // Handle completion of a word
      if (sectionIndex === 2) {
        setIsRoundComplete(true);
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