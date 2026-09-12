/* The Science Lab ships as a pre-built bundle, so these two additions are
   layered on from outside it: a Back control standing in for Return, and
   the per-word hover treatment the lab already styles (.word-hover) but
   only applies to its own headings. Both are re-applied on mutation
   because React re-renders the dialog as the learner moves between
   senses. */
(() => {
  const WORD_TARGETS = [
    '.narrator-line',
    '.sense-progress',
    '.sense-info-panel h2',
    '.sense-info-panel p',
    '.organ-picture p',
    '.sequence-goal',
    '.explorer-guidance',
  ].join(', ');
  const SKIP = 'button, input, select, textarea, .sense-icon, .word-hover';
  let scienceLanguage = (() => { try { return localStorage.getItem('orbit-runner-language') === 'ms' ? 'ms' : 'en'; } catch { return 'en'; } })();
  const scienceTranslations = {
    'Science Lab / Five Senses': 'Makmal Sains / Lima Deria',
    'Learning': 'Pembelajaran',
    'Challenge': 'Cabaran',
    'Continue': 'Teruskan',
    'Back': 'Kembali',
    'Return': 'Kembali',
    'Exit': 'Keluar',
    'Reset': 'Set Semula',
    'Reset progress?': 'Set semula kemajuan?',
    'Yes, reset': 'Ya, set semula',
    'Yes, reset now': 'Ya, set semula sekarang',
    'No, keep progress': 'Tidak, teruskan kemajuan',
    'Completed': 'Selesai',
    'Quiz': 'Kuiz',
    'Correct': 'Betul',
    'Try again': 'Cuba lagi'
  };
  Object.assign(scienceTranslations, {
    'Five Senses': 'Lima Deria',
    'Sense Tap Explorer': 'Peneroka Sentuh Deria',
    'Sense Story Cards': 'Kad Cerita Deria',
    'Tap the Organ Quiz': 'Kuiz Sentuh Organ',
    'Let’s learn about our five senses.': 'Mari belajar tentang lima deria kita.',
    'Choose eyes, ears, nose, tongue, or skin.': 'Pilih mata, telinga, hidung, lidah atau kulit.',
    'Tap all five senses again.': 'Sentuh kelima-lima deria sekali lagi.',
    'Look at the picture. Pick one sense.': 'Lihat gambar. Pilih satu deria.',
    'Listen. Tap.': 'Dengar. Sentuh.',
    'Tap a body part.': 'Sentuh bahagian badan.',
    'Tap the organ you use to see!': 'Sentuh organ yang digunakan untuk melihat!',
    'Tap the organ you use to hear!': 'Sentuh organ yang digunakan untuk mendengar!',
    'Tap the organ you use to smell!': 'Sentuh organ yang digunakan untuk menghidu!',
    'Tap the organ you use to taste!': 'Sentuh organ yang digunakan untuk merasa!',
    'Tap the organ you use to feel!': 'Sentuh organ yang digunakan untuk merasa sentuhan!',
    'These are eyes. We use our eyes to see things around us. Our eyes help us see colours, shapes, people, and places.': 'Ini mata. Kita menggunakan mata untuk melihat perkara di sekeliling kita. Mata membantu kita melihat warna, bentuk, orang dan tempat.',
    'These are ears. We use our ears to hear sounds. Our ears help us hear voices, music, bells, and warnings.': 'Ini telinga. Kita menggunakan telinga untuk mendengar bunyi. Telinga membantu kita mendengar suara, muzik, loceng dan amaran.',
    'This is a nose. We use our nose to smell. Our nose helps us smell flowers, food, smoke, and other things around us.': 'Ini hidung. Kita menggunakan hidung untuk menghidu. Hidung membantu kita menghidu bunga, makanan, asap dan perkara lain di sekeliling kita.',
    'This is a tongue. We use our tongue to taste. Our tongue helps us taste sweet, salty, sour, and bitter food.': 'Ini lidah. Kita menggunakan lidah untuk merasa. Lidah membantu kita merasa makanan manis, masin, masam dan pahit.',
    'This is skin. We use our skin to feel things. Our skin helps us feel hot, cold, soft, hard, smooth, and rough things.': 'Ini kulit. Kita menggunakan kulit untuk merasa sesuatu. Kulit membantu kita merasa panas, sejuk, lembut, keras, licin dan kasar.',
    'Eyes': 'Mata', 'Ears': 'Telinga', 'Nose': 'Hidung', 'Tongue': 'Lidah', 'Skin': 'Kulit',
    'Seeing': 'Penglihatan', 'Hearing': 'Pendengaran', 'Smell': 'Bau', 'Taste': 'Rasa', 'Touch': 'Sentuhan',
    'Great tap!': 'Sentuhan yang hebat!', 'Good job!': 'Bagus!', 'Great work.': 'Kerja yang hebat.',
    'Good try. Try again.': 'Cubaan baik. Cuba lagi.',
    'Great job! You learned all five senses.': 'Bagus sekali! Anda telah mempelajari kelima-lima deria.',
    'Go to Learning first': 'Pergi ke Pembelajaran dahulu', 'Go to Quiz': 'Pergi ke Kuiz',
    'Quiz A: Tap the Organ Quiz': 'Kuiz A: Kuiz Sentuh Organ',
    'Quiz B: Sort the Sense': 'Kuiz B: Susun Deria',
    'Quiz C: Sense Scenario': 'Kuiz C: Situasi Deria',
    'Quiz complete.': 'Kuiz selesai.', 'Lesson complete': 'Pelajaran selesai',
    'Next Lesson': 'Pelajaran Seterusnya', 'Next': 'Seterusnya', 'Finish': 'Tamat',
    'Reset Progress': 'Set Semula Kemajuan', 'Reset progress warning': 'Amaran set semula kemajuan',
    'If you reset, your learning and quiz progress will be cleared.': 'Jika anda menetapkan semula, kemajuan pembelajaran dan kuiz akan dipadamkan.',
    'This will reset your progress now.': 'Ini akan menetapkan semula kemajuan anda sekarang.',
    'Choose yes only if you want to start again.': 'Pilih ya hanya jika anda mahu bermula semula.',
    'You will start again from the Learning Station.': 'Anda akan bermula semula dari Stesen Pembelajaran.',
    'Progress has been reset.': 'Kemajuan telah ditetapkan semula.',
    'Ali hears a bell. Which sense?': 'Ali mendengar loceng. Deria yang mana?',
    'Mia smells soup. Which sense?': 'Mia menghidu sup. Deria yang mana?',
    'Sam tastes an apple. Which sense?': 'Sam merasa epal. Deria yang mana?',
    'Correct. Ali is hearing.': 'Betul. Ali sedang mendengar.',
    'Correct. Mia is smelling.': 'Betul. Mia sedang menghidu.',
    'Correct. Sam is tasting.': 'Betul. Sam sedang merasa.',
    'Bell goes with hearing.': 'Loceng berkaitan dengan pendengaran.',
    'Flower goes with smell.': 'Bunga berkaitan dengan bau.',
    'Candy goes with taste.': 'Gula-gula berkaitan dengan rasa.',
    'Soft toy goes with touch.': 'Mainan lembut berkaitan dengan sentuhan.',
    'We see with our eyes.': 'Kita melihat dengan mata.',
    'We hear with our ears.': 'Kita mendengar dengan telinga.',
    'We smell with our nose.': 'Kita menghidu dengan hidung.',
    'We taste with our tongue.': 'Kita merasa dengan lidah.',
    'We feel with our skin.': 'Kita merasa dengan kulit.',
    'Read aloud is unavailable.': 'Bacaan suara tidak tersedia.',
    'Language': 'Bahasa', 'Larger text': 'Teks besar', 'Text spacing': 'Jarak teks', 'Reduced motion': 'Kurangkan gerakan',
    'Supports': 'Sokongan', 'Listen': 'Dengar', 'Hint': 'Petunjuk'
  });
  const reverseScienceTranslations = Object.fromEntries(Object.entries(scienceTranslations).map(([english, malay]) => [malay, english]));

  function syncNativeScienceLanguage() {
    const target = scienceLanguage === 'ms' ? 'BM' : 'EN';
    document.querySelectorAll('select').forEach(select => {
      const values = [...select.options].map(option => option.value);
      if (!values.includes('EN') || !values.includes('BM') || select.value === target) return;
      select.value = target;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  function translateScienceScreen() {
    syncNativeScienceLanguage();
    const translations = scienceLanguage === 'ms' ? scienceTranslations : reverseScienceTranslations;
    document.documentElement.lang = scienceLanguage;
    document.querySelectorAll('.caption, .caption strong, .activity-dialog h1, .activity-dialog h2, .activity-dialog p, .activity-dialog button, .activity-dialog legend, .sense-info-panel h2, .sense-info-panel p, .sense-explorer-dialog h1, .sense-explorer-dialog h2, .sense-explorer-dialog p, .sense-explorer-dialog button, .tap-quiz-dialog h1, .tap-quiz-dialog h2, .tap-quiz-dialog p, .tap-quiz-dialog button, .explorer-guidance, .flow-notice, .control-notice, .progress-launch, .station-launch, .jv-back-button').forEach(element => {
      const source = element.textContent.trim();
      if (translations[source]) element.textContent = translations[source];
    });
  }
  function applyScienceSettings(settings = {}) {
    document.documentElement.classList.toggle('jv-large-text', settings.largeText === true);
  }
  function applyScienceLanguage(language) {
    scienceLanguage = language === 'ms' ? 'ms' : 'en';
    translateScienceScreen();
  }

  function decorateWords(root) {
    root.querySelectorAll(WORD_TARGETS).forEach(element => {
      if (element.closest('button') || element.querySelector('.word-hover')) return;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const textNodes = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement?.closest(SKIP)) continue;
        if (/\S/.test(node.nodeValue)) textNodes.push(node);
      }
      textNodes.forEach(node => {
        const fragment = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(part => {
          if (/\S/.test(part)) {
            const word = document.createElement('span');
            word.className = 'word-hover';
            word.textContent = part;
            fragment.append(word);
          } else if (part) {
            fragment.append(document.createTextNode(part));
          }
        });
        node.replaceWith(fragment);
      });
    });
  }

  function ensureBackButton() {
    const actions = document.querySelector('.explorer-actions');
    /* The bundle renders the explorer, completion and quiz action rows into one
       ternary slot, so React reuses the same <div> and only swaps its class and
       children. Our Back is prepended outside React's knowledge, so it survives
       that reconciliation and strands itself on the next screen. Drop any Back
       that is no longer in the explorer row: completion ships its own Return
       and Reset, and the quiz ships Exit. */
    document.querySelectorAll('.jv-back-button').forEach(button => {
      if (button.parentElement !== actions) button.remove();
    });
    if (!actions || actions.querySelector('.jv-back-button')) return;
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'jv-back-button activity-exit';
    back.textContent = scienceLanguage === 'ms' ? 'Kembali' : 'Back';
    back.addEventListener('click', () => {
      // In the explorer this is the bundle's Return button, which the theme
      // hides (.explorer-actions .activity-return); a display:none button
      // still takes .click(), and its onClick is the only exit the bundle
      // exposes. history.back() covers the states that render no exit at all.
      const exit = [...document.querySelectorAll('.activity-exit')]
        .find(button => !button.classList.contains('jv-back-button'));
      if (exit) exit.click();
      else history.back();
    });
    actions.prepend(back);
  }

  let pending = 0;
  const apply = () => {
    try {
      decorateWords(document.body);
      ensureBackButton();
    } catch {
      /* A re-render raced us; the next mutation retries. */
    }
  };
  const schedule = () => {
    clearTimeout(pending);
    pending = setTimeout(apply, 60);
  };

  apply();
  new MutationObserver(() => {
    schedule();
    queueMicrotask(translateScienceScreen);
  }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    if (event.data?.type === 'orbit-runner-language') applyScienceLanguage(event.data.language);
    if (event.data?.type === 'orbit-runner-settings') applyScienceSettings(event.data);
  });
  translateScienceScreen();
})();
