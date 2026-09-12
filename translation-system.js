/*
 * The launch screen is intentionally self-contained and works offline.  This
 * keeps every visible parent-game phrase in one English/Malay catalogue so a
 * language change updates both static markup and text created later in play.
 */
(() => {
  const englishToMalay = {
    'DEEP SPACE EXPEDITION / 2086': 'EKSPEDISI ANGKASA DALAM / 2086',
    'ODYSSEY · COMMAND BRIDGE': 'ODYSSEY · JAMBATAN ARAHAN',
    'SATURN ORBIT': 'ORBIT ZUHAL',
    'TRANSMISSION 001': 'TRANSMISI 001',
    'BEYOND THE RINGS': 'MELEPASI GELANG',
    '9.58 AU FROM HOME': '9.58 AU DARI RUMAH',
    'FLIGHT COMMANDER': 'KOMANDER PENERBANGAN',
    'NAVIGATION SPECIALIST': 'PAKAR NAVIGASI',
    'That signal again. Just beyond Saturn’s rings.': 'Isyarat itu lagi. Tepat di luar gelang Zuhal.',
    'Tell me you’re hearing it too.': 'Beritahu saya kamu dengar juga.',
    'I hear it. A repeating pattern… not a distress call.': 'Saya dengar. Corak yang berulang… bukan panggilan kecemasan.',
    'Someone out there wants us to follow.': 'Seseorang di luar sana mahu kita ikut.',
    'Then let’s find them. Choose a route on the console.': 'Mari kita cari mereka. Pilih laluan di konsol.',
    'Stay inside the gates. Watch for ion beams.': 'Kekal di dalam pintu. Awasi pancaran ion.',
    'ODYSSEY / ENCRYPTED COMMS': 'ODYSSEY / KOMUNIKASI DISULITKAN',
    'SPACE / CONTINUE': 'RUANG / TERUSKAN',
    'ROUTE': 'LALUAN',
    'Pick a route.': 'Pilih laluan.',
    'Choose one.': 'Pilih satu.',
    '4 WORLDS': '4 DUNIA',
    '3 WORLDS': '3 DUNIA',
    '2 WORLDS': '2 DUNIA',
    'Human Sense Organ': 'Organ Deria Manusia',
    'Human Growth': 'Pertumbuhan Manusia',
    'Human Body': 'Tubuh Manusia',
    'BACK': 'KEMBALI',
    'HOME': 'LAMAN UTAMA',
    'START ↗': 'MULA ↗',
    'SKIP FLIGHT': 'LANGKAU PENERBANGAN',
    'GATES': 'PINTU',
    'CRUISE': 'JELAJAH',
    'BOOST READY': 'PECUTAN SEDIA',
    'BOOST': 'PECUT',
    'ALIGN WITH THE CYAN ROUTE GATES': 'SEJAJAR DENGAN PINTU LALUAN BIRU KEHIJAUAN',
    'GATE SYNCHRONIZED': 'PINTU DISEGERAKKAN',
    'HULL INTEGRITY': 'INTEGRITI KAPAL',
    'FLIGHT ON HOLD': 'PENERBANGAN DIJEDA',
    'Take a breath.': 'Tarik nafas.',
    'RESUME FLIGHT': 'SAMBUNG PENERBANGAN',
    'NAVIGATION': 'NAVIGASI',
    'INITIALIZING FLIGHT SYSTEMS…': 'MEMULAKAN SISTEM PENERBANGAN…',
    'FLIGHT SYSTEMS READY': 'SISTEM PENERBANGAN SEDIA',
    'EXPEDITION COMPLETE': 'EKSPEDISI SELESAI',
    'FLIGHT SIGNAL LOST': 'ISYARAT PENERBANGAN HILANG',
    'The signal is real.': 'Isyarat itu benar.',
    'A new horizon, reached.': 'Ufuk baharu telah dicapai.',
    'Adrift, but not forgotten.': 'Tersasar, tetapi tidak dilupakan.',
    'FLY AGAIN ↗': 'TERBANG LAGI ↗',
    'CHOOSE ROUTE': 'PILIH LALUAN',
    'All ': 'Semua ',
    ' worlds reached. ': ' dunia telah dicapai. ',
    ' route gates synchronized. ': ' pintu laluan disegerakkan. ',
    '% hull integrity. ': '% integriti kapal. ',
    'Odyssey has your coordinates.': 'Odyssey mempunyai koordinat anda.',
    'The rescue beacon is active.': 'Suar penyelamat aktif.',
    'Take another flight, stay within the cyan gates, and give the red ion beams room.': 'Terbang sekali lagi, kekal di dalam pintu biru kehijauan dan jauhi pancaran ion merah.',
    'DESCENT / LANDING SEQUENCE': 'MENURUN / URUTAN PENDARATAN',
    'WASD / ARROWS · WALK   SHIFT · RUN   F · INTERACT': 'WASD / ANAK PANAH · BERJALAN   SHIFT · LARI   F · BERINTERAKSI',
    'INTERACT': 'BERINTERAKSI',
    'VIEW': 'PAPARAN',
    'Zoom out': 'Zum keluar',
    'Zoom in': 'Zum masuk',
    'PLANETARY SCHOOL / FIELD CLASS': 'SEKOLAH PLANET / KELAS LAPANGAN',
    'BACK TO EXPLORING': 'KEMBALI MENEROKA',
    'BACK TO CLASS': 'KEMBALI KE KELAS',
    'TOP VIEW / ': 'PANDANGAN ATAS / ',
    'ON FOOT / MAYA / REPRESENTATIVE': 'BERJALAN / MAYA / WAKIL',
    'Choose one of four learning tables.': 'Pilih satu daripada empat meja pembelajaran.',
    'LEO: Take your time. Walk up to a table, then press F.': 'LEO: Ambil masa anda. Dekati meja, kemudian tekan F.',
    'Explore both field labs, then return to the school.': 'Teroka kedua-dua makmal lapangan, kemudian kembali ke sekolah.',
    'School visited. Keep exploring or continue your expedition.': 'Sekolah telah dilawati. Teruskan meneroka atau sambung ekspedisi anda.',
    'Discovery badge earned': 'Lencana penemuan diperoleh',
    'You’ve completed this world’s field class. Stay to explore, or depart for your next destination.': 'Anda telah melengkapkan kelas lapangan dunia ini. Teruskan meneroka atau berlepas ke destinasi seterusnya.',
    'Correct! ': 'Betul! ',
    ' school visited on this expedition.': ' sekolah dilawati dalam ekspedisi ini.',
    ' schools visited on this expedition.': ' sekolah dilawati dalam ekspedisi ini.',
    'Not quite — read the field notes above and try again.': 'Belum tepat — baca nota lapangan di atas dan cuba lagi.',
    'This table is complete.': 'Meja ini sudah selesai.',
    'Nice work. You solved this table.': 'Bagus. Anda telah menyelesaikan meja ini.',
    'Try another answer.': 'Cuba jawapan lain.',
    'F · ': 'F · ',
    'RETURN TO CAMPUS': 'KEMBALI KE KAMPUS',
    'OPEN NUMBER BUILDER': 'BUKA BINA NOMBOR',
    'OPEN PATTERN PATH': 'BUKA LALUAN CORAK',
    'OPEN EQUAL GROUPS': 'BUKA KUMPULAN SAMA',
    'OPEN QUICK COMPARE': 'BUKA BANDING PANTAS',
    'VIEW NUMBER BUILDER': 'LIHAT BINA NOMBOR',
    'VIEW PATTERN PATH': 'LIHAT LALUAN CORAK',
    'VIEW EQUAL GROUPS': 'LIHAT KUMPULAN SAMA',
    'VIEW QUICK COMPARE': 'LIHAT BANDING PANTAS',
    'HOLD W / ↑ TO FLY TO ': 'TAHAN W / ↑ UNTUK TERBANG KE ',
    ' ORBIT REACHED': ' ORBIT DICAPAI',
    'FIELD NOTES ': 'NOTA LAPANGAN ',
    'Head to the school entrance.': 'Pergi ke pintu masuk sekolah.',
    'Find the other glowing field lab.': 'Cari makmal lapangan bercahaya yang lain.',
    'LEO: We need both field notes for class. Head back outside and explore the two labs.': 'LEO: Kita perlukan kedua-dua nota lapangan untuk kelas. Kembali ke luar dan teroka dua makmal.',
    'DEPART FOR ': 'BERLEPAS KE ',
    'COMPLETE EXPEDITION ↗': 'SELESAIKAN EKSPEDISI ↗',
    'EARTH LANDING SITE': 'TAPAK PENDARATAN BUMI',
    'WELCOME, EXPLORERS': 'SELAMAT DATANG, PENEROKA',
    '01 / FIELD LAB': '01 / MAKMAL LAPANGAN',
    '02 / SKY OBSERVATORY': '02 / BALAI CERAP LANGIT',
    'DISCOVER · ASK · EXPLORE': 'TEMUI · TANYA · TEROKA',
    'EXIT TO CAMPUS': 'KELUAR KE KAMPUS',
    'LESSON AND QUIZ COMPLETE': 'PELAJARAN DAN KUIZ SELESAI',
    'Continue to the next pattern?': 'Teruskan ke corak seterusnya?',
    'Complete the expedition?': 'Selesaikan ekspedisi?',
    'You finished this lesson and quiz. Keep playing the same expedition by flying to ': 'Anda telah menyelesaikan pelajaran dan kuiz ini. Teruskan ekspedisi yang sama dengan terbang ke ',
    'You finished both learning activities. Would you like to return to the expedition finale?': 'Anda telah menyelesaikan kedua-dua aktiviti pembelajaran. Adakah anda mahu kembali ke penamat ekspedisi?',
    'Fly to next planet': 'Terbang ke planet seterusnya',
    'Finish expedition': 'Selesaikan ekspedisi',
    'Stay here': 'Kekal di sini',
    'TEACHER': 'GURU',
    'Open teacher dashboard': 'Buka papan pemuka guru',
    'Open settings': 'Buka tetapan',
    'Open focus settings': 'Buka tetapan fokus',
    'Return to route selection': 'Kembali ke pilihan laluan',
    'Advance dialogue': 'Teruskan dialog',
    'Pause': 'Jeda',
    'Flight points': 'Mata penerbangan',

    'Earth · Blue Horizon School': 'Bumi · Sekolah Ufuk Biru',
    'Mercury · Dawnside School': 'Utarid · Sekolah Sisi Fajar',
    'Venus · Cloudlight School': 'Zuhrah · Sekolah Cahaya Awan',
    'Mars · Red Dune School': 'Marikh · Sekolah Bukit Pasir Merah',
    'Jupiter · Stormwatch School': 'Musytari · Sekolah Pemerhati Ribut',
    'Saturn · Ringlight School': 'Zuhal · Sekolah Cahaya Gelang',
    'Uranus · Aurora School': 'Uranus · Sekolah Aurora',
    'Neptune · Bluewind School': 'Neptun · Sekolah Angin Biru',
    'Pluto · Far Horizon School': 'Pluto · Sekolah Ufuk Jauh',
    'BLUE HORIZON SCHOOL': 'SEKOLAH UFUK BIRU',
    'DAWNSIDE SCHOOL': 'SEKOLAH SISI FAJAR',
    'CLOUDLIGHT SCHOOL': 'SEKOLAH CAHAYA AWAN',
    'RED DUNE SCHOOL': 'SEKOLAH BUKIT PASIR MERAH',
    'STORMWATCH SCHOOL': 'SEKOLAH PEMERHATI RIBUT',
    'RINGLIGHT SCHOOL': 'SEKOLAH CAHAYA GELANG',
    'AURORA SCHOOL': 'SEKOLAH AURORA',
    'BLUEWIND SCHOOL': 'SEKOLAH ANGIN BIRU',
    'FAR HORIZON SCHOOL': 'SEKOLAH UFUK JAUH',
    'Earth reached.': 'Bumi dicapai.',
    'Mercury reached.': 'Utarid dicapai.',
    'Venus reached.': 'Zuhrah dicapai.',
    'Mars reached.': 'Marikh dicapai.',
    'Jupiter reached.': 'Musytari dicapai.',
    'Saturn reached.': 'Zuhal dicapai.',
    'Uranus reached.': 'Uranus dicapai.',
    'Neptune reached.': 'Neptun dicapai.',
    'Pluto reached.': 'Pluto dicapai.',
    'Liquid water covers about 71% of Earth’s surface.': 'Air cecair meliputi kira-kira 71% permukaan Bumi.',
    'Earth’s atmosphere protects life and helps keep the planet warm.': 'Atmosfera Bumi melindungi kehidupan dan membantu mengekalkan kehangatan planet.',
    'What covers most of Earth’s surface?': 'Apakah yang meliputi sebahagian besar permukaan Bumi?',
    'Liquid water': 'Air cecair', 'Desert sand': 'Pasir gurun', 'Ice': 'Ais',
    'Mercury is the closest planet to the Sun.': 'Utarid ialah planet yang paling dekat dengan Matahari.',
    'Mercury has almost no atmosphere to hold heat.': 'Utarid hampir tiada atmosfera untuk mengekalkan haba.',
    'Why does Mercury lose heat so quickly at night?': 'Mengapakah Utarid kehilangan haba begitu cepat pada waktu malam?',
    'It is far from the Sun': 'Ia jauh dari Matahari', 'It has almost no atmosphere': 'Ia hampir tiada atmosfera', 'It is covered in oceans': 'Ia diliputi lautan',
    'Venus has a thick atmosphere rich in carbon dioxide.': 'Zuhrah mempunyai atmosfera tebal yang kaya dengan karbon dioksida.',
    'Venus is hotter than Mercury because of its powerful greenhouse effect.': 'Zuhrah lebih panas daripada Utarid kerana kesan rumah hijaunya yang kuat.',
    'What makes Venus so hot?': 'Apakah yang menjadikan Zuhrah sangat panas?',
    'Its thick greenhouse atmosphere': 'Atmosfera rumah hijaunya yang tebal', 'It has two suns': 'Ia mempunyai dua matahari', 'It is the closest planet to the Sun': 'Ia planet paling dekat dengan Matahari',
    'Iron minerals give Martian dust its rusty red color.': 'Mineral besi memberikan debu Marikh warna merah berkarat.',
    'Mars has two small moons: Phobos and Deimos.': 'Marikh mempunyai dua bulan kecil: Phobos dan Deimos.',
    'What gives Mars its red color?': 'Apakah yang memberikan Marikh warna merahnya?',
    'Red oceans': 'Lautan merah', 'Iron minerals in its dust': 'Mineral besi dalam debunya', 'Red clouds': 'Awan merah',
    'Jupiter is a gas giant with no solid surface to land on.': 'Musytari ialah gergasi gas tanpa permukaan pepejal untuk didarati.',
    'The Great Red Spot is a giant storm. This campus floats above the clouds.': 'Tompok Merah Besar ialah ribut gergasi. Kampus ini terapung di atas awan.',
    'What is Jupiter’s Great Red Spot?': 'Apakah Tompok Merah Besar Musytari?',
    'A volcano': 'Gunung berapi', 'An ocean': 'Lautan', 'A giant storm': 'Ribut gergasi',
    'Saturn’s rings are made mostly of pieces of ice, with some rock.': 'Gelang Zuhal kebanyakannya terdiri daripada ketulan ais, dengan sedikit batu.',
    'Saturn has no solid surface. Our fictional school floats above its clouds.': 'Zuhal tiada permukaan pepejal. Sekolah fiksyen kami terapung di atas awannya.',
    'What are Saturn’s rings mostly made of?': 'Gelang Zuhal kebanyakannya diperbuat daripada apa?',
    'Pieces of ice': 'Ketulan ais', 'Solid gold': 'Emas padu', 'Clouds of steam': 'Awan wap',
    'Uranus is an ice giant that rotates almost on its side.': 'Uranus ialah gergasi ais yang berputar hampir pada sisinya.',
    'Methane in its atmosphere absorbs red light, giving Uranus a blue-green appearance.': 'Metana dalam atmosferanya menyerap cahaya merah, memberikan Uranus rupa biru kehijauan.',
    'What is unusual about Uranus?': 'Apakah yang luar biasa tentang Uranus?',
    'It has no atmosphere': 'Ia tiada atmosfera', 'It rotates almost on its side': 'Ia berputar hampir pada sisinya', 'It is a star': 'Ia ialah bintang',
    'Neptune has some of the fastest winds in the solar system.': 'Neptun mempunyai antara angin terpantas dalam sistem suria.',
    'Neptune is an ice giant. This floating campus is protected from its storms.': 'Neptun ialah gergasi ais. Kampus terapung ini dilindungi daripada ributnya.',
    'What is Neptune famous for?': 'Apakah yang terkenal tentang Neptun?',
    'Its forests': 'Hutannya', 'Its very fast winds': 'Anginnya yang sangat laju', 'Its warm beaches': 'Pantainya yang panas',
    'Pluto is a dwarf planet in the Kuiper Belt.': 'Pluto ialah planet kerdil di Jalur Kuiper.',
    'Pluto’s surface includes frozen nitrogen and water ice.': 'Permukaan Pluto mengandungi nitrogen beku dan ais air.',
    'How is Pluto classified?': 'Bagaimanakah Pluto dikelaskan?',
    'A gas giant': 'Gergasi gas', 'A star': 'Bintang', 'A dwarf planet': 'Planet kerdil',
    'Number Builder': 'Bina Nombor', 'Pattern Path': 'Laluan Corak', 'Equal Groups': 'Kumpulan Sama', 'Quick Compare': 'Banding Pantas',
    '3 each': '3 setiap seorang', '4 each': '4 setiap seorang', '5 each': '5 setiap seorang'
  };

  const malayToEnglish = Object.fromEntries(Object.entries(englishToMalay).map(([english, malay]) => [malay, english]));
  const ignored = 'script, style, textarea, option, code, [data-no-translate], #languageToggle';
  let queued = false;
  let pauseMutationsUntil = 0;

  const dictionary = () => document.documentElement.lang === 'ms' ? englishToMalay : malayToEnglish;
  const translateValue = (value, phrases = dictionary()) => {
    if (!value || !/\S/.test(value)) return value;
    if (phrases[value]) return phrases[value];
    let translated = value;
    for (const [source, target] of Object.entries(phrases).sort(([a], [b]) => b.length - a.length)) {
      if (translated.includes(source)) translated = translated.replaceAll(source, target);
    }
    return translated;
  };

  const unwrapWords = () => {
    document.querySelectorAll('#ui .hover-word, #surfaceHud .hover-word, #classroomZoom .hover-word, #lesson .hover-word, #result .hover-word, #pause .hover-word, #nextPlanetPrompt .hover-word').forEach(word => {
      word.replaceWith(document.createTextNode(word.textContent));
    });
  };

  const translatePage = () => {
    pauseMutationsUntil = performance.now() + 120;
    unwrapWords();
    const phrases = dictionary();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.parentElement?.closest(ignored) && /\S/.test(node.nodeValue)) textNodes.push(node);
    }
    textNodes.forEach(node => {
      const next = translateValue(node.nodeValue, phrases);
      if (next !== node.nodeValue) node.nodeValue = next;
    });
    document.querySelectorAll('[aria-label], [title], [placeholder]').forEach(element => {
      if (element.closest(ignored)) return;
      for (const attribute of ['aria-label', 'title', 'placeholder']) {
        const value = element.getAttribute(attribute);
        const next = translateValue(value, phrases);
        if (next !== value) element.setAttribute(attribute, next);
      }
    });
    document.title = document.documentElement.lang === 'ms' ? 'Pelari Orbit' : 'Orbit Runner';
    const lab = document.getElementById('mathsLab');
    lab?.contentWindow?.postMessage({type: 'orbit-runner-language', language: document.documentElement.lang}, location.origin);
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    window.setTimeout(() => { queued = false; translatePage(); }, 0);
  };

  const start = () => {
    document.getElementById('languageToggle')?.addEventListener('click', schedule);
    document.getElementById('mathsLab')?.addEventListener('load', schedule);
    new MutationObserver(() => schedule()).observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});
    new MutationObserver(records => {
      if (performance.now() < pauseMutationsUntil) return;
      const changedOutsideWordDecoration = records.some(record => {
        const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
        return !target?.closest('.hover-word');
      });
      if (changedOutsideWordDecoration) schedule();
    }).observe(document.body, {childList: true, characterData: true, subtree: true});
    schedule();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once: true});
  else start();
})();
