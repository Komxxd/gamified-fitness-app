import React, { useState } from 'react';
import { Tooltip, Paper, Typography } from '@mui/material';
import roguesSprite from '../assets/32rogues-0.5.0/32rogues/rogues.png';
import './CharacterSelector.css';

const CharacterSelector = ({ onCharacterSelect }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // Character data with descriptions
  const characters = [
    { id: '1.a', name: 'dwarf', gridX: 0, gridY: 0, description: 'A stout and sturdy warrior with exceptional strength and endurance.' },
    { id: '1.b', name: 'elf', gridX: 1, gridY: 0, description: 'An agile and graceful being with mastery over archery and nature magic.' },
    { id: '1.c', name: 'ranger', gridX: 2, gridY: 0, description: 'A skilled tracker and wilderness expert proficient in both combat and survival.' },
    { id: '1.d', name: 'rogue', gridX: 3, gridY: 0, description: 'A cunning adventurer specializing in stealth and precision strikes.' },
    { id: '1.e', name: 'bandit', gridX: 4, gridY: 0, description: 'A ruthless outlaw skilled in ambush tactics and swift combat.' },
    { id: '2.a', name: 'knight', gridX: 0, gridY: 1, description: 'A noble warrior trained in the arts of chivalry and heavy combat.' },
    { id: '2.b', name: 'male fighter', gridX: 1, gridY: 1, description: 'A versatile combatant skilled in various fighting styles.' },
    { id: '2.c', name: 'female knight', gridX: 2, gridY: 1, description: 'A valiant warrior combining strength with tactical expertise.' },
    { id: '2.d', name: 'female knight (helmetless)', gridX: 3, gridY: 1, description: 'A fearless knight who prefers visibility over head protection.' },
    { id: '2.e', name: 'shield knight', gridX: 4, gridY: 1, description: 'A defensive specialist trained in shield combat techniques.' },
    { id: '3.a', name: 'monk', gridX: 0, gridY: 2, description: 'A martial artist who harnesses inner spiritual energy.' },
    { id: '3.b', name: 'priest', gridX: 1, gridY: 2, description: 'A holy person channeling divine power for healing and protection.' },
    { id: '3.c', name: 'female war cleric', gridX: 2, gridY: 2, description: 'A battle priest combining divine magic with martial prowess.' },
    { id: '3.d', name: 'male war cleric', gridX: 3, gridY: 2, description: 'A warrior of faith wielding both weapons and holy magic.' },
    { id: '3.e', name: 'templar', gridX: 4, gridY: 2, description: 'A holy warrior dedicated to their divine cause.' },
    { id: '3.f', name: 'schema monk', gridX: 5, gridY: 2, description: 'A monk who follows ancient mystical teachings.' },
    { id: '3.g', name: 'elder schema monk', gridX: 6, gridY: 2, description: 'A wise monk who has mastered ancient techniques.' },
    { id: '4.a', name: 'male barbarian', gridX: 0, gridY: 3, description: 'A fierce warrior who relies on raw strength and fury.' },
    { id: '4.b', name: 'male winter barbarian', gridX: 1, gridY: 3, description: 'A hardy barbarian adapted to harsh cold climates.' },
    { id: '4.c', name: 'female winter barbarian', gridX: 2, gridY: 3, description: 'A powerful warrior tempered by the frozen north.' },
    { id: '4.d', name: 'swordsman', gridX: 3, gridY: 3, description: 'A master of blade combat and swordsmanship.' },
    { id: '4.e', name: 'fencer', gridX: 4, gridY: 3, description: 'An elegant fighter specializing in precise sword techniques.' },
    { id: '4.f', name: 'female barbarian', gridX: 5, gridY: 3, description: 'A fierce warrior channeling primal strength in battle.' },
    { id: '5.a', name: 'female wizard', gridX: 0, gridY: 4, description: 'A powerful spellcaster versed in arcane arts.' },
    { id: '5.b', name: 'male wizard', gridX: 1, gridY: 4, description: 'A scholar of magical arts and mystical knowledge.' },
    { id: '5.c', name: 'druid', gridX: 2, gridY: 4, description: 'A guardian of nature wielding elemental magic.' },
    { id: '5.d', name: 'desert sage', gridX: 3, gridY: 4, description: 'A mystic who draws power from ancient desert wisdom.' },
    { id: '5.e', name: 'dwarf mage', gridX: 4, gridY: 4, description: 'A rare dwarf who has mastered arcane magic.' },
    { id: '6.f', name: 'warlock', gridX: 5, gridY: 5, description: 'A spellcaster who draws power from otherworldly pacts.' },
    { id: '7.a', name: 'farmer (wheat thresher)', gridX: 0, gridY: 6, description: 'A hardworking farmer skilled with agricultural tools.' },
    { id: '7.b', name: 'farmer (scythe)', gridX: 1, gridY: 6, description: 'A farmer who has adapted their tool for combat.' },
    { id: '7.c', name: 'farmer (pitchfork)', gridX: 2, gridY: 6, description: 'A farmer defending their land with farming implements.' },
    { id: '7.d', name: 'baker', gridX: 3, gridY: 6, description: 'A skilled artisan of breads and pastries.' },
    { id: '7.e', name: 'blacksmith', gridX: 4, gridY: 6, description: 'A master craftsman of weapons and armor.' },
    { id: '7.f', name: 'scholar', gridX: 5, gridY: 6, description: 'A learned individual seeking knowledge and wisdom.' },
    { id: '8.a', name: 'peasant / coalburner', gridX: 0, gridY: 7, description: 'A hard worker skilled in producing fuel.' },
    { id: '8.b', name: 'peasant', gridX: 1, gridY: 7, description: 'A common person living off the land.' },
    { id: '8.c', name: 'shopkeep', gridX: 2, gridY: 7, description: 'A merchant trading in various goods and wares.' },
    { id: '8.d', name: 'elderly woman', gridX: 3, gridY: 7, description: 'A wise woman with years of experience.' },
    { id: '8.e', name: 'elderly man', gridX: 4, gridY: 7, description: 'A seasoned individual with many stories to tell.' }
  ];

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
    if (onCharacterSelect) {
      onCharacterSelect(character);
    }
  };

  return (
    <Paper elevation={3} className="character-selector">
      <Typography variant="h4" className="title">
        Choose Your Character
      </Typography>

      <div className="character-grid">
        {characters.map((character) => {
          const spriteX = character.gridX * 32;
          const spriteY = character.gridY * 32;
          
          return (
            <Tooltip 
              key={character.id}
              title={character.description}
              arrow
              placement="top"
            >
              <div
                className={`character-option ${selectedCharacter?.id === character.id ? 'selected' : ''}`}
                onClick={() => handleCharacterSelect(character)}
              >
                <div
                  className="character-sprite"
                  style={{
                    backgroundImage: `url(${roguesSprite})`,
                    backgroundPosition: `-${spriteX}px -${spriteY}px`,
                    width: '32px',
                    height: '32px',
                    imageRendering: 'pixelated'
                  }}
                />
                <Typography className="character-name">
                  {character.name}
                </Typography>
              </div>
            </Tooltip>
          );
        })}
      </div>
    </Paper>
  );
};

export default CharacterSelector; 