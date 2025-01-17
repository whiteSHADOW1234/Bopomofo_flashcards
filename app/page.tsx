"use client"; // Ensure this is a Client Component

import { useState, useEffect } from "react";
import styles from "./Home.module.css"; // CSS module for styling

export default function Home() {
  const firstSet = "厶ㄘㄗㄖㄕㄔㄓㄒㄑㄐㄏㄎㄍㄌㄋㄊㄉㄈㄇㄆㄅ".split("");
  const secondSet = "ㄨ一ㄩㄨ一ㄩㄨ一ㄩㄨ一ㄩㄨ一ㄩㄨ一ㄩㄨ一ㄩ".split("");
  const thirdSet = "ㄤ ㄣ ㄢ ㄡ ㄠ ㄟ ㄞ ㄝ ㄜ ㄛ ㄚ ㄤˋ ㄣˊ ㄢˊ ㄡˋ ㄠˇ ㄟˊ ㄞˇ ㄝˋ ㄜˇ ㄥ".split(" ");

  // State for the shuffled alphabets for three sections
  const [section1, setSection1] = useState<string[]>([]);
  const [section2, setSection2] = useState<string[]>([]);
  const [section3, setSection3] = useState<string[]>([]);

  // Function to shuffle the alphabet
  const shuffleFirstSet = () => {
    const shuffled1 = [...firstSet].sort(() => Math.random() - 0.5);
    return shuffled1;
  };

  const shuffleSecondSet = () => {
    const shuffled2 = [...secondSet].sort(() => Math.random() - 0.5);
    return shuffled2;
  }

  const shuffleaThirdSet = () => {
    const shuffled3 = [...thirdSet].sort(() => Math.random() - 0.5);
    return shuffled3;
  }

  // Effect to shuffle the alphabets for each section on component mount
  useEffect(() => {
    setSection1(shuffleFirstSet()); // Shuffle for section 1
    setSection2(shuffleSecondSet()); // Shuffle for section 2
    setSection3(shuffleaThirdSet()); // Shuffle for section 3
  }, []);


  // Flashcard component
  const Flashcard = ({
    letter,
    colorClass,
    onFlip,
    isLastFlipped,
  }: {
    letter: string;
    colorClass: string;
    onFlip: () => void; // Add onFlip prop
    isLastFlipped: boolean; // Add isLastFlipped prop
  }) => {
    const [flipped, setFlipped] = useState(false);
  
    return (
      <div
        className={`${styles.card} ${flipped ? styles.flipped : ""} ${isLastFlipped ? styles.glow : ""}`} // Apply glow class if it's the last flipped card
        onClick={() => {
          setFlipped(!flipped);
          onFlip(); // Call onFlip function
        }}
      >
        <div className={`${styles.cardFront} ${colorClass}`}>
          <span className={styles.letter}></span>
        </div>
        <div className={styles.cardBack}>
          <span className={styles.letter}>{letter}</span>
        </div>
      </div>
    );
  };
  

  type SectionProps = {
    letters: string[];
    colorClass: string;
  };

  // Section of cards
  const Section: React.FC<SectionProps> = ({ letters, colorClass }) => {
    const [lastFlippedIndex, setLastFlippedIndex] = useState<number | null>(null);
  
    return (
      <div className={styles.section}>
        <main className={styles.cardGrid}>
          {letters.map((letter, index) => (
            <Flashcard
              key={letter}
              letter={letter}
              colorClass={colorClass}
              onFlip={() => setLastFlippedIndex(index)} // Update last flipped index
              isLastFlipped={lastFlippedIndex === index} // Check if this is the last flipped card
            />
          ))}
        </main>
      </div>
    );
  };
  


  return (
    <div className={styles.mainContainer}>
      <h1 className={styles.pageTitle}>
        注<span className={styles.straight}>ㄓㄨ</span><span className={styles.punctuation}>ˋ</span>{'\u00A0'}
        音<span className={styles.straight}>一ㄣ</span>{'\u00A0'}
        符<span className={styles.straight}>ㄈㄨ</span><span className={styles.punctuation}>ˊ</span>{'\u00A0'}
        號<span className={styles.straight}>ㄏㄠ</span><span className={styles.punctuation}>ˋ</span>{'\u00A0'}
        字<span className={styles.straight}>ㄗ</span><span className={styles.punctuation}>ˋ</span>{'\u00A0'}
        卡<span className={styles.straight}>ㄎㄚ</span><span className={styles.punctuation}>ˇ</span> {'\u00A0'}{'\u00A0'}
        
      </h1>
      <div className={styles.colorTags}>
        <span className={`${styles.colorTag} ${styles.redBackground}`}> 
          聲<span className={styles.straight}>ㄕㄥ</span>{'\u00A0'}  
          符<span className={styles.straight}>ㄈㄨ</span><span className={styles.punctuation}>ˊ</span>{'\u00A0'}
        </span>
        <span className={`${styles.colorTag} ${styles.greenBackground}`}> 
          介<span className={styles.straight}>ㄐ一ㄝ</span><span className={styles.punctuation}>ˋ</span>{'\u00A0'}
          音<span className={styles.straight}>一ㄣ</span>{'\u00A0'}  
        </span>
        <span className={`${styles.colorTag} ${styles.blueBackground}`}> 
          韻<span className={styles.straight}>ㄩㄣ</span><span className={styles.punctuation}>ˋ</span>{'\u00A0'} 
          符<span className={styles.straight}>ㄈㄨ</span><span className={styles.punctuation}>ˊ</span>{'\u00A0'} 
        </span>
      </div>
      <Section 
        letters={section1} 
        colorClass={styles.redBackground}
      />
      <Section 
        letters={section2} 
        colorClass={styles.greenBackground}
      />
      <Section 
        letters={section3} 
        colorClass={styles.blueBackground}
      />
    </div>
  );
}