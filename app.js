/* Multiview — Sports
   A local, dependency-free multiview board.
   State lives in localStorage; nothing leaves this browser. */

(() => {
  'use strict';

  /* ── constants ─────────────────────────────────────────────── */

  const LS_KEY = 'multiview.sports.v1';
  const MAX_TILES = 4;
  /* Nine verified 24/7 channels. The default demo uses the first four; the layout
     demo can rebuild the board with one, two or four screens. */
  /* Channel /live URLs, not video ids: YouTube resolves whatever stream that channel
     is running right now, so the demo survives a stream ending. */
  const DEMO_POOL = [
    'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live', /* NewsNation */
    'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live', /* Bloomberg Television */
    /* These two channels do not allow the live_stream embed; use the current video. */
    'https://www.youtube.com/watch?v=3zcO7qaUiHs', /* Disney Kids 24/7 */
    'https://www.youtube.com/watch?v=ALGbqW-tUAQ', /* Boomerang / Tom & Jerry */
    'https://www.youtube.com/watch?v=6QFVhVT187M', /* ABC News Live */
    'https://www.youtube.com/watch?v=Lhk3Gu0YeRs', /* LiveNOW from FOX */
    'https://www.youtube.com/watch?v=q8Puv82CkFw', /* CBS News 24/7 */
    'https://www.youtube.com/watch?v=ZxCeWQ3Lcig', /* EarthCam Times Square */
    'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf', /* MrBeast long-form */
  ];
  const DEMO_LINKS = DEMO_POOL.slice(0, 4).join(' ');

  /* Side-by-side comfort: Family Guy / American Dad long cuts. Used by the
     2-up demo and the funny preset. */
  const FUNNY_POOL = [
    'https://www.youtube.com/watch?v=y198LBLnC30', /* Family Guy 160 min */
    'https://www.youtube.com/watch?v=jXj9CyjwcWI', /* American Dad 4.5 h */
  ];

  /* Fallback pool uses the most dependable always-on set: news feeds, a city
     camera, MrBeast long-form and cartoons. */
  const DEMO_NINE = [
    'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live', /* NewsNation */
    'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live', /* Bloomberg Television */
    'https://www.youtube.com/watch?v=6QFVhVT187M', /* ABC News Live */
    'https://www.youtube.com/watch?v=Lhk3Gu0YeRs', /* LiveNOW from FOX */
    'https://www.youtube.com/watch?v=q8Puv82CkFw', /* CBS News 24/7 */
    'https://www.youtube.com/watch?v=ZxCeWQ3Lcig', /* Times Square */
    'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf', /* MrBeast long-form */
    'https://www.youtube.com/watch?v=nIyaCRNwxhU', /* Gumball */
    'https://www.youtube.com/watch?v=4In8wOZreGQ', /* Family Guy */
  ];

  function demoLinksFor(count) {
    if (Number(count) === 2) return FUNNY_POOL.slice(0, 2).join(' ');
    return (count === 9 ? DEMO_NINE : DEMO_POOL.slice(0, count)).join(' ');
  }

  function shuffled(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
    }
    return copy;
  }

  /* The previous demo shipped two on-demand films. Replace them in place so an
     existing Demo board starts on live channels without losing its layout. */
  const RETIRED_DEMO = {
    /* old demo tiles map to the URL that actually embeds today */
    'UCeY0bbntWzzVIaj2z3QigXg': 'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live',
    'UC8p1vwvWtl6T73JiExfWs1g': 'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live',
    'UC7Gf2tZ8coTX2ckTPgn62iQ': 'https://www.youtube.com/watch?v=3zcO7qaUiHs',
    'UCmst562fALOY2cKb4IFgqEg': 'https://www.youtube.com/watch?v=ALGbqW-tUAQ',
    'UCLA_DiR1FfKNvjuUpBHmylQ': 'https://www.youtube.com/watch?v=q8Puv82CkFw',
    'UC6qrG3W8SMK0jior2olka3g': 'https://www.youtube.com/watch?v=ZxCeWQ3Lcig',
    '4xDzrJKXOOY': 'https://www.youtube.com/watch?v=3zcO7qaUiHs',
    'aqz-KE-bpKQ': 'https://www.youtube.com/watch?v=ALGbqW-tUAQ',
    'UCVgO39Bk5sMo66-6o6Spn6Q': 'https://www.youtube.com/channel/UCSPEjw8F2nQDtmUKPFNF7_A/live',
    'vOTiJkg1voo': 'https://www.youtube.com/channel/UCSPEjw8F2nQDtmUKPFNF7_A/live',
    'gCNeDWCI0vo': 'https://www.youtube.com/channel/UCNye-wNBqNL5ZzHSJj3l8Bg/live',
    '2MC5ltEDu7w': 'https://www.youtube.com/watch?v=3zcO7qaUiHs',
    'rEKifG2XUZg': 'https://www.youtube.com/watch?v=ALGbqW-tUAQ',
    '3zcO7qaUiHs': 'https://www.youtube.com/watch?v=3zcO7qaUiHs',
    'ALGbqW-tUAQ': 'https://www.youtube.com/watch?v=ALGbqW-tUAQ',
    'ROboUHfPUrU': 'https://www.youtube.com/watch?v=q8Puv82CkFw',
    'UUX6OQ3DkcsbYNE6H8uQQuVA': 'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf',
    'ZxCeWQ3Lcig': 'https://www.youtube.com/watch?v=ZxCeWQ3Lcig',
    'LuKwFajn37U': 'https://www.youtube.com/channel/UCknLrEdhRCp1aegoMqRaCZg/live',
    'HvZt-nh9sGg': 'https://www.youtube.com/channel/UCQfwfsi5VrQ8yKZ-UWmAEFg/live',
    'pykpO5kQJ98': 'https://www.youtube.com/channel/UCSrZ3UV4jOidv8ppoVuvW9Q/live',
  };

  /* Channel handles resolve to a channel id so a pasted channel link can open
     its live feed by default. Unknown handles still open the live page in a
     window, because only the id form can be embedded. */
  /* The MrBeast uploads playlist can surface Shorts. Official long-form playlists
     are used instead, and any pasted uploads link is redirected to one. */
  const PLAYLIST_ALIASES = {
    UUX6OQ3DkcsbYNE6H8uQQuVA: 'PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf',
    UUIPPMRA040LQr5QPyJEbmXA: 'PLnYX1qinc5ASs-gDN960p3yo_YOYvialR',
  };

  const YT_HANDLES = {
    cbsnews: 'UC-SJ6nODDmufqBzPBwCvYvQ',
    nbcnews: 'UChDKyKQ59fYz3JO2fl0Z6sg',
    abcnews: 'UCBi2mrWuNuyYy4gbM6fU18Q',
    livenowfox: 'UCDiPds0v60wueil5B8w3fPQ',
    nasa: 'UC9SM7V7J1pAhPabOUST01fw',
    earthcam: 'UC6qrG3W8SMK0jior2olka3g',
    cartoonnetwork: 'UC9trsD1jCTXXtN3xIOIU8gg',
    boomerang: 'UCmst562fALOY2cKb4IFgqEg',
    boomeranguk: 'UCmst562fALOY2cKb4IFgqEg',
    mrbeast: 'UCX6OQ3DkcsbYNE6H8uQQuVA',
    mrbeastgaming: 'UCIPPMRA040LQr5QPyJEbmXA',
    goodmythicalmorning: 'UC4PooiX37Pld1T8J5SYT-SQ',
    gmm: 'UC4PooiX37Pld1T8J5SYT-SQ',
    teamcoco: 'UCi7GJNg51C3jgmYTUwqoUXA',
    conanobrien: 'UCi7GJNg51C3jgmYTUwqoUXA',
    markrober: 'UC513PdAP2-jWkJunTh5kXRw',
    dudeperfect: 'UCJrWyyCRROi8NlQ6Xd9dx5Q',
    sidemen: 'UCh5mLn90vUaB1PbRRx_AiaA',
    michellekhare: 'UCGGZ_POGmIWG1pQXTDzQv-g',
    airrack: 'UC7oAKdhAM_ImxYOkLLPC9TQ',
    zachking: 'UCiJUp_NBW2D_UMQIvq2nlPg',
    corridorcrew: 'UCsn6cjffsvyOZCZxvGoJxGg',
    yestheory: 'UCTd7KzdwnFE3lm6LCfYDmUQ',
    jubilee: 'UCQCKnN9inc30A9f7IYP5_QA',
    linustechtips: 'UCdBK94H6oZT2Q7l0-b0xmMg',
    mkbhd: 'UCG7J20LhUeLl6y_Emi7OJrA',
    ted: 'UCsT0YIqwnpJCM-mx7-gSA4Q',
    kurzgesagt: 'UCq8ZAAsI89IoJ-fn1gYpO3g',
    veritasium: 'UC1UmujXTizWokDHojdEOdow',
    numberphile: 'UCtwKon9qMt5YLVgQt1tvJKg',
    vsauce: 'UC6nSFpj9HTCZ5t-N3Rm3-HA',
    nba: 'UCWJ2lWNubArHWmf3FIHbfcQ',
    mlb: 'UCoLrcjPV5PbUrUyXq5mjc_A',
    olympics: 'UC_kdjhHnkUbSImMrezjRyDQ',
    ufc: 'UCPQDDlGe7lbgmEJ0ge7a_JA',
    espncollegefootball: 'UCzRWWsFjqHk1an4OnVPsl9g',
    espncfb: 'UCzRWWsFjqHk1an4OnVPsl9g',
    premierleague: 'UCpryVRk_VDudG8SHXgWcG0w',
    newsnation: 'UCGWTUS6esxeTcmFJN_RwbEQ',
    markets: 'UCIALMKvObZNtJ6AmdCLP7Lg',
    bloomberg: 'UCIALMKvObZNtJ6AmdCLP7Lg',
  };

  /* Curated walls for people who just want something on. */
  const PRESETS = [
    {
      key: 'now', name: 'Live now', layout: '4', blurb: 'the live desk · right now',
      thumbs: ['6QFVhVT187M', 'Lhk3Gu0YeRs', 'q8Puv82CkFw', 'nIyaCRNwxhU'],
      links: [
        'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live',
        'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live',
        'https://www.youtube.com/watch?v=6QFVhVT187M',
        'https://www.youtube.com/watch?v=Lhk3Gu0YeRs',
      ],
    },
    {
      key: 'funny', name: 'Funny', layout: '2', blurb: 'Family Guy · American Dad · 1080p · random',
      random: true, pick: 2, rights: 'unofficial',
      thumbs: ['w4Nbko1XSmE', 'KnPo721gsdQ', 'Xas1acxbOPE', 'ZxrSCOICwy0'],
      links: [
        'https://www.youtube.com/watch?v=w4Nbko1XSmE',
        'https://www.youtube.com/watch?v=Xas1acxbOPE',
        'https://www.youtube.com/watch?v=rXO58Tuw7hM',
        'https://www.youtube.com/watch?v=Z7Ra8Wa-WMI',
        'https://www.youtube.com/watch?v=y198LBLnC30',
        'https://www.youtube.com/watch?v=KnPo721gsdQ',
        'https://www.youtube.com/watch?v=ZxrSCOICwy0',
        'https://www.youtube.com/watch?v=MyWrQ4MfCFY',
        'https://www.youtube.com/watch?v=jXj9CyjwcWI',
        'https://www.youtube.com/watch?v=XsgR6chaUX0',
        'https://www.youtube.com/watch?v=FqX11xEj2dY',
      ],
    },
    {
      key: 'toons', name: 'Toons', layout: '4', blurb: 'Family Guy · American Dad · South Park · more',
      random: true, pick: 4, rights: 'unofficial',
      thumbs: ['w4Nbko1XSmE', '1stTAgaCVl4', 'RRNRfUp_59Q', 'Z5taZV1QtX0'],
      links: [
        'https://www.youtube.com/watch?v=w4Nbko1XSmE',
        'https://www.youtube.com/watch?v=Xas1acxbOPE',
        'https://www.youtube.com/watch?v=rXO58Tuw7hM',
        'https://www.youtube.com/watch?v=Z7Ra8Wa-WMI',
        'https://www.youtube.com/watch?v=y198LBLnC30',
        'https://www.youtube.com/watch?v=KnPo721gsdQ',
        'https://www.youtube.com/watch?v=ZxrSCOICwy0',
        'https://www.youtube.com/watch?v=MyWrQ4MfCFY',
        'https://www.youtube.com/watch?v=jXj9CyjwcWI',
        'https://www.youtube.com/watch?v=orY_F-dr8FQ',
        'https://www.youtube.com/watch?v=1stTAgaCVl4',
        'https://www.youtube.com/watch?v=-_vB7acWUBQ',
        'https://www.youtube.com/watch?v=saJ492nvdfM',
        'https://www.youtube.com/watch?v=x8gg9Hgq49g',
        'https://www.youtube.com/watch?v=MsZOI4I79RA',
        'https://www.youtube.com/watch?v=QvKgE7B4lNA',
        'https://www.youtube.com/watch?v=f49IabS-weA',
        'https://www.youtube.com/watch?v=RRNRfUp_59Q',
        'https://www.youtube.com/watch?v=C2hJE1v9gN0',
        'https://www.youtube.com/watch?v=czsmDa2I6Nc',
        'https://www.youtube.com/watch?v=w9gdGRaNmbw',
        'https://www.youtube.com/watch?v=aunEug8h8Rw',
        'https://www.youtube.com/watch?v=vYQva3Ep7Kk',
        'https://www.youtube.com/watch?v=QeVasLgV104',
        'https://www.youtube.com/watch?v=QjDDgysq2jM',
        'https://www.youtube.com/watch?v=7sqv8AO7nZA',
        'https://www.youtube.com/watch?v=Z5taZV1QtX0',
        'https://www.youtube.com/watch?v=3R6IO5lx_Z0',
        'https://www.youtube.com/watch?v=_K6dhjaVCNY',
        'https://www.youtube.com/watch?v=KqzTah1lEq8',
      ],
    },
    {
      key: 'news', name: 'News desk', layout: '4', blurb: '4 live news channels',
      thumbs: ['j1ro7bw5RkA', 'Ij63STuAJmg', 'q8Puv82CkFw', '6QFVhVT187M'],
      links: [
        'https://www.youtube.com/channel/UCGWTUS6esxeTcmFJN_RwbEQ/live',
        'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live',
        'https://www.youtube.com/watch?v=6QFVhVT187M',
        'https://www.youtube.com/watch?v=Lhk3Gu0YeRs',
      ],
    },
    {
      key: 'always', name: 'Always on', layout: '4', blurb: '4 continuous live channels',
      thumbs: ['nIyaCRNwxhU', 'yhB3BgJyGl8', 'VGScBYjXVYE', 'q8Puv82CkFw'],
      links: [
        'https://www.youtube.com/watch?v=nIyaCRNwxhU',
        'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf',
        'https://www.youtube.com/watch?v=VGScBYjXVYE',
        'https://www.youtube.com/watch?v=039MsWsk7yI',
        'https://www.youtube.com/watch?v=q8Puv82CkFw',
        'https://www.youtube.com/watch?v=ZxCeWQ3Lcig',
      ],
    },
    {
      key: 'cartoons', name: 'Cartoons', layout: '2', blurb: '2 live cartoon channels',
      thumbs: ['3zcO7qaUiHs', 'ALGbqW-tUAQ', 'nIyaCRNwxhU', '4In8wOZreGQ'],
      links: [
        'https://www.youtube.com/watch?v=3zcO7qaUiHs',
        'https://www.youtube.com/watch?v=ALGbqW-tUAQ',
      ],
    },
    {
      key: 'sports', name: 'Sports', layout: '4', blurb: 'NBA · MLB · UFC · Olympics',
      thumbs: ['y-jR93AytPc', 'QkGOollG-S4', 'p4aNGqai4ec', 'ie920kzulsc'],
      links: [
        'https://www.youtube.com/watch?v=y-jR93AytPc',
        'https://www.youtube.com/watch?v=QkGOollG-S4',
        'https://www.youtube.com/watch?v=p4aNGqai4ec',
        'https://www.youtube.com/watch?v=ie920kzulsc',
        'https://www.youtube.com/watch?v=IIy0uIqFjb0',
        'https://www.youtube.com/watch?v=MRO9RbJuZLg',
      ],
    },
    {
      key: 'esports', name: 'Esports', layout: '4', blurb: 'CS2 · ESL · BLAST · PGL · IEM',
      thumbs: ['Se6OL_DsGo8', 'kKXxKBT78XU', 'WuYwSxueXFY', 'LOmIAhhKKgU'],
      links: [
        'https://www.youtube.com/watch?v=Se6OL_DsGo8',
        'https://www.youtube.com/watch?v=kKXxKBT78XU',
        'https://www.youtube.com/watch?v=WuYwSxueXFY',
        'https://www.youtube.com/watch?v=LOmIAhhKKgU',
      ],
    },
    {
      key: 'creators', name: 'Creators', layout: '4', blurb: 'MrBeast · Mark Rober · Dude Perfect · Sidemen',
      thumbs: ['yhB3BgJyGl8', 'k3bxIR2mQng', 'akWVq27OEys', 'ssMtANeN5Ew'],
      links: [
        'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf',
        'https://www.youtube.com/playlist?list=PLnYX1qinc5ASs-gDN960p3yo_YOYvialR',
        'https://www.youtube.com/playlist?list=UU4PooiX37Pld1T8J5SYT-SQ',
        'https://www.youtube.com/playlist?list=UUi7GJNg51C3jgmYTUwqoUXA',
        'https://www.youtube.com/playlist?list=UU513PdAP2-jWkJunTh5kXRw',
        'https://www.youtube.com/playlist?list=UUJrWyyCRROi8NlQ6Xd9dx5Q',
        'https://www.youtube.com/playlist?list=UUh5mLn90vUaB1PbRRx_AiaA',
        'https://www.youtube.com/playlist?list=UUGGZ_POGmIWG1pQXTDzQv-g',
        'https://www.youtube.com/playlist?list=UU7oAKdhAM_ImxYOkLLPC9TQ',
      ],
    },
    {
      key: 'hacker', name: 'Hacker', layout: '4', blurb: 'HN picks · 6502 · UNIX · Guy Steele',
      thumbs: ['LnzuMJLZRdU', 'tc4ROCJYbm0', '_ahvzDzKdB0', 'FITJMJjASUs'],
      links: [
        'https://www.youtube.com/watch?v=LnzuMJLZRdU',
        'https://www.youtube.com/watch?v=tc4ROCJYbm0',
        'https://www.youtube.com/watch?v=_ahvzDzKdB0',
        'https://www.youtube.com/watch?v=FITJMJjASUs',
      ],
    },
    {
      key: 'comedy', name: 'Comedy', layout: '4', blurb: 'South Park · Family Guy · Gravity Falls · Rick & Morty',
      thumbs: ['nztEvZDfOxI', '4In8wOZreGQ', 'NXrfWL6joj0', 'VDefM-uIbTU'],
      links: [
        'https://www.youtube.com/watch?v=nztEvZDfOxI',
        'https://www.youtube.com/watch?v=ucbDHiBb47k',
        'https://www.youtube.com/watch?v=Dwti9AZsyLo',
        'https://www.youtube.com/watch?v=4In8wOZreGQ',
        'https://www.youtube.com/watch?v=NXrfWL6joj0',
        'https://www.youtube.com/watch?v=VDefM-uIbTU',
      ],
    },
    {
      key: 'tech', name: 'Tech', layout: '4', blurb: 'LTT · MKBHD · Corridor · Mark Rober',
      thumbs: ['BCGNAUuSDzY', 'v92XR6RwB9Q', 'e6JbkxkH8-Y', 'G99ycZV6g1g'],
      links: [
        'https://www.youtube.com/playlist?list=UUdBK94H6oZT2Q7l0-b0xmMg',
        'https://www.youtube.com/playlist?list=UUG7J20LhUeLl6y_Emi7OJrA',
        'https://www.youtube.com/playlist?list=UUsn6cjffsvyOZCZxvGoJxGg',
        'https://www.youtube.com/playlist?list=UU513PdAP2-jWkJunTh5kXRw',
      ],
    },
    {
      key: 'science', name: 'Science', layout: '4', blurb: 'Veritasium · Kurzgesagt · Numberphile · Vsauce',
      thumbs: ['teQi1dVC_X4', 'QQXCC6o_LHU', 'cW7P3LVV-YA', 'sQjWFvpTg7Y'],
      links: [
        'https://www.youtube.com/playlist?list=UU1UmujXTizWokDHojdEOdow',
        'https://www.youtube.com/playlist?list=UUq8ZAAsI89IoJ-fn1gYpO3g',
        'https://www.youtube.com/playlist?list=UUtwKon9qMt5YLVgQt1tvJKg',
        'https://www.youtube.com/playlist?list=UU6nSFpj9HTCZ5t-N3Rm3-HA',
      ],
    },
    {
      key: 'late', name: 'Late night', layout: '4', blurb: 'Conan · GMM · Sidemen · Jubilee',
      thumbs: ['1yHpPTXWwyc', 'yHrqckpTCTg', 'ssMtANeN5Ew', '_s9A-0iASMw'],
      links: [
        'https://www.youtube.com/playlist?list=UUi7GJNg51C3jgmYTUwqoUXA',
        'https://www.youtube.com/playlist?list=UU4PooiX37Pld1T8J5SYT-SQ',
        'https://www.youtube.com/playlist?list=UUh5mLn90vUaB1PbRRx_AiaA',
        'https://www.youtube.com/playlist?list=UUQCKnN9inc30A9f7IYP5_QA',
      ],
    },
    {
      key: 'learning', name: 'Learning', layout: '4', blurb: 'TED · Kurzgesagt · Veritasium · Numberphile',
      thumbs: ['OmEj96r-HY4', 'QQXCC6o_LHU', 'teQi1dVC_X4', 'v92XR6RwB9Q'],
      links: [
        'https://www.youtube.com/playlist?list=UUsT0YIqwnpJCM-mx7-gSA4Q',
        'https://www.youtube.com/playlist?list=UUq8ZAAsI89IoJ-fn1gYpO3g',
        'https://www.youtube.com/playlist?list=UU1UmujXTizWokDHojdEOdow',
        'https://www.youtube.com/playlist?list=UUtwKon9qMt5YLVgQt1tvJKg',
        'https://www.youtube.com/playlist?list=UU6nSFpj9HTCZ5t-N3Rm3-HA',
        'https://www.youtube.com/playlist?list=UUG7J20LhUeLl6y_Emi7OJrA',
      ],
    },
  ];

  /* Sites that redirect the frame to their chat/landing page instead of playing.
     Pasting one opens a real window immediately — never a broken tile. */
  /* Live-TV aggregators. Their players are nested frames that refuse to connect
     (or they redirect), so a tile can only ever show the chat shell. They open
     in a window instead. */
  const WINDOW_ONLY_HOSTS = [
    'streamcorner.st',
    'dlive.sx', 'daddylive.pk', 'thedaddy.li',
    'streamsports99.ru', 'streamsports99.website',
    'sportsbite.org',
    'ntv.st',
    'famelack.com',
    '90minutes.pro',
    'zlive.st',
    'livelive24.com',
    'watchtvs.live',
    'tvnow247.top',
    'tvexplorer.live',
    'xyzstreams.st',
    'freetvgarden.com',
    'kool.ws',
    '1tube.org',
    'damitv.st',
    'cxtvlive.com',
    'iptv-web.app',
    'tvnow.st',
  ];

  function windowOnly(host) {
    if (!host) return false;
    if (WINDOW_ONLY_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return true;
    return !!(state && Array.isArray(state.windowOnlyHosts) &&
      state.windowOnlyHosts.some((h) => host === h || host.endsWith('.' + h)));
  }

  function unlearnWindowOnly(host) {
    if (!host || !state || !Array.isArray(state.windowOnlyHosts)) return;
    state.windowOnlyHosts = state.windowOnlyHosts.filter((h) => h !== host);
  }

  function learnWindowOnly(host) {
    if (!host || !state) return;
    /* never learn the local dev origin itself */
    if (host === 'localhost' || host === '127.0.0.1') return;
    state.windowOnlyHosts = state.windowOnlyHosts || [];
    if (state.windowOnlyHosts.indexOf(host) === -1) {
      state.windowOnlyHosts.push(host);
      state.windowOnlyHosts = state.windowOnlyHosts.slice(-50);
    }
  }

  const DEMO_NAMES = {
    'UCNye-wNBqNL5ZzHSJj3l8Bg': 'Al Jazeera English',
    'UCVgO39Bk5sMo66-6o6Spn6Q': 'ABC News Australia',
    'vOTiJkg1voo': 'ABC News Australia',
    'UCSPEjw8F2nQDtmUKPFNF7_A': 'NHK World-Japan',
    'UC8p1vwvWtl6T73JiExfWs1g': 'CBS News',
    'UCGWTUS6esxeTcmFJN_RwbEQ': 'NewsNation',
    'UCeY0bbntWzzVIaj2z3QigXg': 'NBC News NOW',
    'UCIALMKvObZNtJ6AmdCLP7Lg': 'Bloomberg TV',
    '6QFVhVT187M': 'ABC News',
    'Lhk3Gu0YeRs': 'LiveNOW FOX',
    'UC1_E8NeF5QHY2dtdLRBCCLA': 'Africanews',
    'UCknLrEdhRCp1aegoMqRaCZg': 'DW News',
    'UCQfwfsi5VrQ8yKZ-UWmAEFg': 'France 24',
    'UCSrZ3UV4jOidv8ppoVuvW9Q': 'Euronews',
    'UC7Gf2tZ8coTX2ckTPgn62iQ': 'Disney Kids 24/7',
    '3zcO7qaUiHs': 'Disney Kids 24/7',
    'UCmst562fALOY2cKb4IFgqEg': 'Tom & Jerry 24/7',
    'ALGbqW-tUAQ': 'Tom & Jerry 24/7',
    'UCLA_DiR1FfKNvjuUpBHmylQ': 'NASA ISS',
    'ROboUHfPUrU': 'NASA ISS',
    'q8Puv82CkFw': 'CBS News 24/7',
    'PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf': 'MrBeast',
    'UC6qrG3W8SMK0jior2olka3g': 'Times Square',
    'ZxCeWQ3Lcig': 'Times Square',
    'y-jR93AytPc': 'NBA highlights',
    'p4aNGqai4ec': 'Premier League goals',
    'QkGOollG-S4': 'MLB full game',
    'ie920kzulsc': 'Olympics highlights',
    'nIyaCRNwxhU': 'Gumball 24/7',
    'S_71wzZMf0M': 'Mr Bean 24/7',
    'VGScBYjXVYE': 'Police 24/7',
    '039MsWsk7yI': 'Bodycam 24/7',
    'IIy0uIqFjb0': 'UFC highlights',
    'MRO9RbJuZLg': 'College football',
    'Se6OL_DsGo8': 'ESL CS2',
    'kKXxKBT78XU': 'BLAST Premier',
    'WuYwSxueXFY': 'PGL',
    'LOmIAhhKKgU': 'IEM CS2',
    'nztEvZDfOxI': 'South Park',
    'ucbDHiBb47k': 'South Park',
    'Dwti9AZsyLo': 'South Park',
    'UUX6OQ3DkcsbYNE6H8uQQuVA': 'MrBeast',
    'UU4PooiX37Pld1T8J5SYT-SQ': 'Good Mythical Morning',
    'UUi7GJNg51C3jgmYTUwqoUXA': 'Conan',
    'UUIPPMRA040LQr5QPyJEbmXA': 'MrBeast Gaming',
    '4In8wOZreGQ': 'Family Guy',
    'NXrfWL6joj0': 'Gravity Falls',
    'VDefM-uIbTU': 'Rick and Morty',
  };

  /* Pricing seam. stage: 'beta' = everything free; 'paid' = Pro visible and
     checkout enabled once sync.js + the backend are wired. */
  const PLAN = {
    stage: 'beta',        /* 'beta' = everything free; 'paid' = trial + Pro only */
    trialDays: 7,
    price: '$5',
    priceNote: 'one time fee',
    freeBoards: 2,
  };

  /* Resolved at runtime when the optional sync backend is signed in. */
  let planInfo = { mode: 'beta', daysLeft: 0, entitled: true };

  const PARENT_HOST = location.hostname || 'localhost';

  const LAYOUTS = {
    '1': { cols: 1, rows: 1, cap: 1 },
    '2': { cols: 2, rows: 1, cap: 2 },
    '4': { cols: 2, rows: 2, cap: 4 },
  };
  const LAYOUT_ORDER = ['1', '2', '4'];

  /* Never frame the app inside itself: it would recurse, and a same-origin
     frame with allow-same-origin + allow-scripts is not a sandbox at all. */
  const PUBLIC_HOSTS = new Set(['multiview.cc', 'multiview-cc.pages.dev']);
  function isSelfHost(host) {
    const h = String(host || '').toLowerCase();
    if (!h) return false;
    return h === hostOf(location.href) || PUBLIC_HOSTS.has(h);
  }

  const MUTABLE = new Set(['youtube', 'twitch', 'kick', 'vimeo', 'dailymotion']);

  const KIND_LABEL = {
    youtube: 'YouTube',
    twitch: 'Twitch',
    kick: 'Kick',
    vimeo: 'Vimeo',
    dailymotion: 'Dailymotion',
    rumble: 'Rumble',
    media: 'Stream',
    generic: 'Web',
    blocked: 'No embed',
  };

  /* Sites that send X-Frame-Options / CSP frame-ancestors and can never be framed. */
  const BLOCKED_HOSTS = {
    'espn.com': 'ESPN',
    'espn.co.uk': 'ESPN UK',
    'espnplus.com': 'ESPN+',
    'nba.com': 'NBA',
    'nfl.com': 'NFL',
    'mlb.com': 'MLB',
    'nhl.com': 'NHL',
    'formula1.com': 'F1',
    'f1.com': 'F1 TV',
    'motogp.com': 'MotoGP',
    'foxsports.com': 'FOX Sports',
    'cbssports.com': 'CBS Sports',
    'nbcsports.com': 'NBC Sports',
    'skysports.com': 'Sky Sports',
    'dazn.com': 'DAZN',
    'peacocktv.com': 'Peacock',
    'samsungtvplus.com': 'Samsung TV Plus',
    'pluto.tv': 'Pluto TV',
    'tubitv.com': 'Tubi',
    'freevee.com': 'Freevee',
    'watch.plex.tv': 'Plex',
    'hulu.com': 'Hulu',
    'disneyplus.com': 'Disney+',
    'netflix.com': 'Netflix',
    'fox.com': 'Fox',
    'tv.apple.com': 'Apple TV',
    'sling.com': 'Sling',
    'ufcfightpass.com': 'UFC Fight Pass',
    'primevideo.com': 'Prime Video',
    'max.com': 'Max',
    'paramountplus.com': 'Paramount+',
    'tntdrama.com': 'TNT',
    'bleacherreport.com': 'Bleacher Report',
    'willow.tv': 'Willow TV',
    'tsn.ca': 'TSN',
    'sportsnet.ca': 'Sportsnet',
    'kayosports.com.au': 'Kayo',
    'disneyplus.com': 'Disney+',
    'hotstar.com': 'Hotstar',
    'sonyliv.com': 'SonyLIV',
    'supersport.com': 'SuperSport',
    'tv.youtube.com': 'YouTube TV',
    'youtube.com': 'YouTube',
    'twitch.tv': 'Twitch',
    'kick.com': 'Kick',
    'damitv.st': 'DamiTV',
    'cxtvlive.com': 'CXtv',
    'iptv-web.app': 'IPTV Web',
    'tvnow.st': 'TVNow',
  };

  /* Friendly names for hosts we know about, used for tile titles. */
  const SITE_NAMES = {
    'dlive.sx': 'DaddyLive',
    'daddylive.pk': 'DaddyLive',
    'thedaddy.li': 'DaddyLive',
    'streamsports99.ru': 'StreamSports99',
    'streamsports99.website': 'StreamSports99',
    'sportsbite.org': 'SportsBite',
    'ntv.st': 'NTV',
    'zlive.st': 'zlive',
    'famelack.com': 'Famelack',
    '90minutes.pro': '90 Minutes',
    'livelive24.com': 'Live24',
    'watchtvs.live': 'WatchTVs',
    'tvnow247.top': 'TV247US',
    'tvexplorer.live': 'TV Explorer',
    'xyzstreams.st': 'xyzstreams',
    'freetvgarden.com': 'FreeTVGarden',
    'kool.ws': 'kool.to',
    '1tube.org': '1Tube',
    'tvnow.st': 'TVNow',
    'damitv.st': 'DamiTV',
    'cxtvlive.com': 'CXtv',
    'iptv-web.app': 'IPTV Web',
    'rumble.com': 'Rumble',
    'vimeo.com': 'Vimeo',
    'dailymotion.com': 'Dailymotion',
    'dai.ly': 'Dailymotion',
  };

  const ICONS = {
    volume: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M4 7.6h2.4L10 4.4v11.2L6.4 12.4H4z" fill="currentColor"/><path d="M12.4 7.4a3.6 3.6 0 0 1 0 5.2M14.4 5.4a6.4 6.4 0 0 1 0 9.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    volumeOff: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M4 7.6h2.4L10 4.4v11.2L6.4 12.4H4z" fill="currentColor"/><path d="M13 7.8l4 4.4M17 7.8l-4 4.4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    reload: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M16 10a6 6 0 1 1-1.8-4.3M16 3.6V7h-3.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    popout: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M9 4H4.9A1.9 1.9 0 0 0 3 5.9v9.2A1.9 1.9 0 0 0 4.9 17h9.2a1.9 1.9 0 0 0 1.9-1.9V11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M11 3h6v6M17 3l-7.2 7.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    expand: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M4 8V4h4M16 12v4h-4M12 4h4v4M8 16H4v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M10 9v4.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="10" cy="6.6" r="1" fill="currentColor"/></svg>',
    fullscreen: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><rect x="3" y="4.5" width="14" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M7 8.5 9.5 6M7 8.5h2.5M13 11.5 10.5 14M13 11.5h-2.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    collapse: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M12.5 7.5 16.5 3.5M16.5 3.5h-3.6M16.5 3.5v3.6M7.5 12.5 3.5 16.5M3.5 16.5h3.6M3.5 16.5v-3.6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    cc: '<span class="cc-glyph" aria-hidden="true">CC</span>',
    audio: '<svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M3.6 12.2v-1.4a6.4 6.4 0 0 1 12.8 0v1.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><rect x="2.4" y="11.8" width="4.2" height="5.9" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="13.4" y="11.8" width="4.2" height="5.9" rx="1.7" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    blocked: '<svg viewBox="0 0 20 20" width="17" height="17" aria-hidden="true"><rect x="3" y="4.5" width="14" height="11" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3.8 15.2 16.2 4.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  };

  /* ── tiny helpers ──────────────────────────────────────────── */

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const uid = () => Math.random().toString(36).slice(2, 9);
  /* A playlist embed accepts a 1-based index; starting at a random item gives a
     different set of videos each time a creator wall is rebuilt. */
  const playlistStart = () => 1 + Math.floor(Math.random() * 50);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; }
  }

  function niceHost(host) {
    if (!host) return 'link';
    if (SITE_NAMES[host]) return SITE_NAMES[host];
    const parts = host.split('.');
    const base = parts.length > 1 ? parts[parts.length - 2] : parts[0];
    return base.charAt(0).toUpperCase() + base.slice(1);
  }

  const LOGIN_HOSTS = [
    'hulu.com', 'disneyplus.com', 'netflix.com', 'primevideo.com', 'max.com',
    'peacocktv.com', 'paramountplus.com', 'fox.com', 'foxsports.com', 'espn.com',
    'nba.com', 'nfl.com', 'mlb.com', 'nhl.com', 'dazn.com', 'ufcfightpass.com',
    'f1.com', 'formula1.com', 'sling.com', 'willow.tv', 'tsn.ca', 'tv.apple.com',
  ];

  function isLoginHost(host) {
    return LOGIN_HOSTS.some((key) => host === key || host.endsWith('.' + key));
  }

  function blockedName(host) {
    let best = null;
    for (const key of Object.keys(BLOCKED_HOSTS)) {
      if (host === key || host.endsWith('.' + key)) {
        if (!best || key.length > best.length) best = key;
      }
    }
    return best ? BLOCKED_HOSTS[best] : niceHost(host);
  }

  function isBlockedHost(host) {
    return Object.keys(BLOCKED_HOSTS).some((key) => host === key || host.endsWith('.' + key));
  }

  function toast(message, type) {
    const host = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    host.appendChild(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => el.remove(), 220);
    }, 3800);
  }

  /* ── link parsing ──────────────────────────────────────────── */

  function normalizeLink(raw) {
    let s = String(raw || '').trim().replace(/^[<("'\s]+|[>)"',\s]+$/g, '');
    if (!s || s.length > 4096) return null;
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) s = 'https://www.youtube.com/watch?v=' + s; // bare YouTube id
    if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) s = 'https://' + s;
    try {
      const u = new URL(s);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
      if (!u.hostname || (!u.hostname.includes('.') && u.hostname !== 'localhost')) return null;
      return u.toString();
    } catch {
      return null;
    }
  }

  function makeTile(kind, url, embed, extra = {}) {
    return {
      id: uid(),
      url,
      embed: embed || null,
      kind,
      host: hostOf(url),
      name: '',
      muted: state.muted,
      cc: false,
      force: false,
      ...extra,
    };
  }

  /** Turn any pasted string into a tile definition, or null if it isn't a link. */
  function parseLink(raw) {
    const url = normalizeLink(raw);
    if (!url) return null;

    let u;
    try { u = new URL(url); } catch { return null; }

    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    if (isSelfHost(host)) return null;
    const seg = u.pathname.split('/').filter(Boolean);
    const q = u.searchParams;

    /* YouTube TV is a paid app and blocks framing. */
    if (host === 'tv.youtube.com' || host === 'youtubetv.com') {
      return makeTile('blocked', url, null);
    }

    /* ── YouTube ── */
    if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const yt = (embed) => makeTile('youtube', url, embed);

      const ytList = (list) => {
        const target = PLAYLIST_ALIASES[list] || list;
        const tile = makeTile('youtube',
          `https://www.youtube.com/playlist?list=${encodeURIComponent(target)}`,
          `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(target)}`);
        tile.shuffle = playlistStart();
        /* Curated and pasted playlists should stay on long-form, horizontal
           videos. The player reports each video's duration; anything Short-length
           is skipped. A single video or /shorts link is never filtered. */
        tile.longform = 90;
        return tile;
      };

      if (host === 'youtu.be' && seg[0]) {
        const list = q.get('list');
        if (list && /^PL/i.test(list)) return ytList(list);
        return yt(`https://www.youtube.com/embed/${seg[0]}`);
      }
      if (seg[0] === 'watch') {
        const list = q.get('list');
        /* A watch link inside a real playlist is treated as that playlist so the
           wall can start it at a random video. Mixes (RD…) stay as the video. */
        if (list && /^PL/i.test(list)) return ytList(list);
        if (q.get('v')) return yt(`https://www.youtube.com/embed/${q.get('v')}`);
      }
      if (seg[0] === 'playlist' && q.get('list')) return ytList(q.get('list'));
      if (['live', 'shorts', 'embed', 'v'].includes(seg[0]) && seg[1]) return yt(`https://www.youtube.com/embed/${seg[1]}`);
      /* Channel links default to the live feed. The tile remembers the channel's
         uploads playlist so a channel that is not live can still play something. */
      const liveTile = (id, label) => {
        const live = `https://www.youtube.com/channel/${id}/live`;
        const tile = makeTile('youtube', live, `https://www.youtube.com/embed/live_stream?channel=${id}`);
        tile.liveFallback = `https://www.youtube.com/playlist?list=UU${id.slice(2)}`;
        if (label) tile.name = label;
        return tile;
      };

      if (seg[0] === 'channel' && /^UC[\w-]{22}$/.test(seg[1] || '')) {
        return liveTile(seg[1]);
      }
      if (seg[0] && seg[0].startsWith('@')) {
        const handle = seg[0].slice(1);
        const id = YT_HANDLES[handle.toLowerCase()];
        if (id) return liveTile(id, handle);
        /* Unknown handle: open its live page in a window rather than a dead card. */
        return makeTile('blocked', `https://www.youtube.com/@${handle}/live`, null, { reason: 'channel' });
      }
      if ((seg[0] === 'c' || seg[0] === 'user') && seg[1]) {
        const id = YT_HANDLES[seg[1].toLowerCase()];
        if (id) return liveTile(id, seg[1]);
        return makeTile('blocked', `https://www.youtube.com/${seg[0]}/${seg[1]}/live`, null, { reason: 'channel' });
      }

      /* Channel pages without an id cannot be embedded without an API lookup. */
      return makeTile('blocked', url, null, { reason: 'channel' });
    }

    /* ── Twitch ── */
    if (host === 'twitch.tv' || host.endsWith('.twitch.tv')) {
      const parent = `parent=${encodeURIComponent(PARENT_HOST)}`;
      if (host === 'clips.twitch.tv' && seg[0]) {
        return makeTile('twitch', url, `https://clips.twitch.tv/embed?clip=${encodeURIComponent(seg[0])}&${parent}`);
      }
      if (seg[0] === 'videos' && seg[1]) {
        return makeTile('twitch', url, `https://player.twitch.tv/?video=${encodeURIComponent(seg[1])}&${parent}`);
      }
      if (seg[0] === 'clip' && seg[1]) {
        return makeTile('twitch', url, `https://clips.twitch.tv/embed?clip=${encodeURIComponent(seg[1])}&${parent}`);
      }
      const reserved = new Set(['directory', 'search', 'downloads', 'jobs', 'turbo', 'settings', 'subscriptions', 'inventory', 'wallet', 'drops', 'friends']);
      if (seg[0] && !reserved.has(seg[0])) {
        return makeTile('twitch', url, `https://player.twitch.tv/?channel=${encodeURIComponent(seg[0])}&${parent}`);
      }
      return makeTile('generic', url, null);
    }

    /* ── Kick ── */
    if (host === 'kick.com' || host.endsWith('.kick.com')) {
      if (seg[0] === 'video' && seg[1]) return makeTile('kick', url, `https://player.kick.com/video/${encodeURIComponent(seg[1])}`);
      if (seg[0] && !['category', 'browse', 'following', 'dashboard'].includes(seg[0])) {
        return makeTile('kick', url, `https://player.kick.com/${encodeURIComponent(seg[0])}`);
      }
      return makeTile('generic', url, null);
    }

    /* ── Vimeo ── */
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const id = seg.find((s) => /^\d+$/.test(s));
      if (id) return makeTile('vimeo', url, `https://player.vimeo.com/video/${id}`);
      return makeTile('generic', url, null);
    }

    /* ── Dailymotion ── */
    if (host === 'dai.ly' && seg[0]) {
      return makeTile('dailymotion', url, `https://www.dailymotion.com/embed/video/${seg[0]}`);
    }
    if (host === 'dailymotion.com' || host.endsWith('.dailymotion.com')) {
      const i = seg.indexOf('video');
      if (i !== -1 && seg[i + 1]) return makeTile('dailymotion', url, `https://www.dailymotion.com/embed/video/${seg[i + 1]}`);
      return makeTile('generic', url, null);
    }

    /* ── Rumble ── */
    if (host === 'rumble.com' || host.endsWith('.rumble.com')) {
      const m = u.pathname.match(/^\/(?:embed\/)?(v[0-9a-z]+)/i);
      if (m) return makeTile('rumble', url, `https://rumble.com/embed/${m[1]}/`);
      return makeTile('generic', url, null);
    }

    /* ── Direct media files play in our own player ── */
    const mediaMatch = u.pathname.match(/\.(m3u8|mp4|webm|ogg|ogv|m4v|mov)$/i);
    if (mediaMatch) {
      const ext = mediaMatch[1].toLowerCase();
      const file = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || 'Stream');
      const tile = makeTile('media', url, null);
      tile.media = {
        url: url,
        title: file.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').slice(0, 80) || 'Stream',
        group: '',
        source: 'url',
        itemId: '',
        hls: ext === 'm3u8',
      };
      return tile;
    }

    /* ── Known frames-busters ── */
    if (isBlockedHost(host)) return makeTile('blocked', url, null);

    return makeTile('generic', url, null);
  }

  function srcFor(tile) {
    if (!tile.embed) return tile.url;
    if (!MUTABLE.has(tile.kind)) return tile.embed;
    let u;
    try { u = new URL(tile.embed); } catch { return tile.embed; }
    /* Always boot muted so autoplay is allowed. Audio state is applied with
       postMessage after load, so toggling audio never changes the URL and
       never restarts the video. */
    if (tile.kind === 'twitch' || tile.kind === 'kick') {
      u.searchParams.set('autoplay', 'true');
      u.searchParams.set('muted', 'true');
    } else if (tile.kind === 'vimeo') {
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('muted', '1');
      u.searchParams.set('api', '1');
    } else {
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('mute', '1');
      if (tile.kind === 'youtube') {
        if (tile.shuffle) u.searchParams.set('index', String(tile.shuffle));
        u.searchParams.set('playsinline', '1');
        u.searchParams.set('rel', '0');
        u.searchParams.set('modestbranding', '1');
        u.searchParams.set('iv_load_policy', '3');
        u.searchParams.set('vq', 'hd1080');
        u.searchParams.set('controls', '0');
        u.searchParams.set('fs', '0');
        u.searchParams.set('disablekb', '1');
        u.searchParams.set('cc_load_policy', tile.cc ? '1' : '0');
        /* A single video restarts immediately when it ends; playlists already
           auto-advance to the next video. */
        if (!u.searchParams.get('list') && !/videoseries/.test(tile.embed || '')) {
          const vid = ytVideoId(tile.url) || (String(tile.embed || '').match(/\/embed\/([A-Za-z0-9_-]{11})/) || [])[1];
          if (vid) {
            u.searchParams.set('loop', '1');
            u.searchParams.set('playlist', vid);
          }
        }
        /* Lets the player report an unavailable video back to the app. No
           external script is loaded: this is the documented postMessage API. */
        if (/^https?:$/.test(location.protocol)) {
          u.searchParams.set('enablejsapi', '1');
          u.searchParams.set('origin', location.origin);
        }
      }
    }
    return u.toString();
  }

  function titleFor(tile) {
    if (tile.name) return tile.name;
    if (tile.media && tile.media.title) return tile.media.title;
    if (tile.kind === 'blocked') return blockedName(tile.host);
    if (tile.kind === 'generic' || tile.kind === 'media') return niceHost(tile.host);
    return KIND_LABEL[tile.kind] || niceHost(tile.host);
  }

  /* ── state ─────────────────────────────────────────────────── */

  function makeView(name) {
    return { id: uid(), name: name || 'Board 1', layout: '4', tiles: [], audioFocus: null, wallPreset: 'auto' };
  }

  /* Everyone who opens the app during beta is recorded as a founder. The record
     lives in this browser until accounts ship; the downloaded build carries its
     own BETA-LICENSE so it keeps working without any server. */
  function newAccess() {
    const chunk = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return { edition: 'founder', id: 'MV-' + chunk() + '-' + chunk(), since: Date.now() };
  }

  let state = null;
  let focusedId = null;
  let drag = null;
  let lastTileId = null;
  const tileNodes = new Map();

  let freshInstall = false;
  let genericHintShown = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) throw new Error('empty');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.views) || !parsed.views.length) throw new Error('shape');
      parsed.views = parsed.views.map((v) => ({
        id: v.id || uid(),
        name: typeof v.name === 'string' && v.name ? v.name : 'Board',
        layout: LAYOUTS[v.layout] ? v.layout : '4',
        audioFocus: typeof v.audioFocus === 'string' ? v.audioFocus : null,
        wallPreset: typeof v.wallPreset === 'string' ? v.wallPreset : 'auto',
        preset: typeof v.preset === 'string' ? v.preset : '',
        tiles: Array.isArray(v.tiles) ? v.tiles.map((t) => {
          if (!t || typeof t.url !== 'string') return null;
          const safePage = normalizeLink(t.url);
          if (!safePage) return null;
          const safeFrame = t.embed ? window.MVLib.safeUrl(t.embed) : null;
          if (safeFrame && isSelfHost(hostOf(safeFrame))) return null;
          const safeMedia = t.media && typeof t.media === 'object' && typeof t.media.url === 'string'
            ? window.MVLib.safeUrl(t.media.url)
            : null;
          return {
          id: t.id || uid(),
          url: safePage,
          embed: safeFrame,
          kind: t.kind === 'media' || KIND_LABEL[t.kind] ? t.kind : 'generic',
          host: hostOf(safePage),
          name: typeof t.name === 'string' ? t.name : '',
          muted: typeof t.muted === 'boolean' ? t.muted : parsed.muted !== false,
          cc: !!t.cc,
          shuffle: Number.isInteger(t.shuffle) ? t.shuffle : (t.embed && String(t.embed).includes('videoseries') ? playlistStart() : 0),
          force: !!t.force,
          broken: Number.isInteger(t.broken) ? t.broken : 0,
          liveFallback: typeof t.liveFallback === 'string' ? t.liveFallback : '',
          longform: Number.isInteger(t.longform)
            ? t.longform
            : ((t.embed && String(t.embed).includes('videoseries')) || String(t.url).includes('playlist?list=') ? 90 : 0),
          reason: t.reason || '',
          media: safeMedia
            ? {
              url: safeMedia,
              title: typeof t.media.title === 'string' ? t.media.title : '',
              group: typeof t.media.group === 'string' ? t.media.group : '',
              source: typeof t.media.source === 'string' ? t.media.source : 'iptv',
              itemId: typeof t.media.itemId === 'string' ? t.media.itemId : '',
              hls: !!t.media.hls,
            }
            : null,
          };
        }).filter(Boolean) : [],
      }));
      if (!parsed.views.some((v) => v.id === parsed.activeId)) parsed.activeId = parsed.views[0].id;
      return {
        v: 2,
        muted: parsed.muted !== false,
        ccDefault: !!parsed.ccDefault,
        activeId: parsed.activeId,
        history: Array.isArray(parsed.history) ? parsed.history.slice(0, 30).filter((h) => h && typeof h.url === 'string').map((h) => ({
          url: h.url,
          title: typeof h.title === 'string' ? h.title.slice(0, 120) : '',
          at: typeof h.at === 'number' ? h.at : Date.now(),
          source: typeof h.source === 'string' ? h.source : 'web',
        })) : [],
        windowOnlyHosts: Array.isArray(parsed.windowOnlyHosts)
          ? parsed.windowOnlyHosts.filter((h) => typeof h === 'string' && h.length < 80).slice(-50)
          : [],
        showHeaders: parsed.showHeaders === true,
        autoHide: parsed.autoHide !== false,
        access: parsed.access && typeof parsed.access === 'object' && typeof parsed.access.id === 'string'
          ? {
            edition: 'founder',
            id: parsed.access.id.slice(0, 24),
            since: typeof parsed.access.since === 'number' ? parsed.access.since : Date.now(),
          }
          : null,
        sources: {
          iptv: parsed.sources && parsed.sources.iptv && Array.isArray(parsed.sources.iptv.channels) ? parsed.sources.iptv : null,
          jellyfin: parsed.sources && parsed.sources.jellyfin && typeof parsed.sources.jellyfin.baseUrl === 'string' ? parsed.sources.jellyfin : null,
        },
        views: parsed.views,
      };
    } catch {
      freshInstall = true;
      const view = makeView('Demo');
      return { v: 2, muted: true, ccDefault: false, showHeaders: false, autoHide: true, access: newAccess(), activeId: view.id, history: [], windowOnlyHosts: [], sources: { iptv: null, jellyfin: null }, views: [view] };
    }
  }

  let lastSaved = '';

  function save() {
    let payload;
    try {
      payload = JSON.stringify(state);
    } catch {
      return;
    }
    /* renders call save() a lot; a write that changes nothing is pure main-thread cost */
    if (payload === lastSaved) return;
    try {
      localStorage.setItem(LS_KEY, payload);
      lastSaved = payload;
    } catch {
      /* Most likely a big IPTV playlist. Keep the app usable and say what happened. */
      try {
        const trimmed = JSON.parse(JSON.stringify(state));
        if (trimmed.sources && trimmed.sources.iptv) trimmed.sources.iptv.channels = [];
        if (trimmed.sources && trimmed.sources.iptv) trimmed.sources.iptv.epgUrl = trimmed.sources.iptv.epgUrl || '';
        trimmed.history = (trimmed.history || []).slice(0, 5);
        const smaller = JSON.stringify(trimmed);
        localStorage.setItem(LS_KEY, smaller);
        lastSaved = smaller;
        toast('Storage is full — the channel list will not survive a reload. Smaller playlists stay saved.', 'warn');
      } catch {
        toast('Could not save — storage is full or blocked.', 'warn');
      }
    }
  }

  const activeView = () => state.views.find((v) => v.id === state.activeId) || state.views[0];

  function eachTile(fn) {
    state.views.forEach((view) => view.tiles.forEach(fn));
  }

  function findTile(id) {
    for (const view of state.views) {
      const tile = view.tiles.find((t) => t.id === id);
      if (tile) return tile;
    }
    return null;
  }

  /* ── chrome: tabs, layout picker ───────────────────────────── */

  function layoutIcon(key) {
    const L = LAYOUTS[key];
    const size = 15;
    const gap = 1.6;
    const w = (size - gap * (L.cols - 1)) / L.cols;
    const h = (size - gap * (L.rows - 1)) / L.rows;
    let rects = '';
    for (let r = 0; r < L.rows; r++) {
      for (let c = 0; c < L.cols; c++) {
        rects += `<rect x="${(c * (w + gap)).toFixed(2)}" y="${(r * (h + gap)).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="1.1" fill="currentColor" opacity="${c === 0 && r === 0 ? 1 : 0.55}"/>`;
      }
    }
    return `<svg viewBox="0 0 ${size} ${size}" width="15" height="15" aria-hidden="true">${rects}</svg>`;
  }

  function renderTabs() {
    const wrap = $('#tabs');
    const sig = state.activeId + '|' + state.views.length + '|' +
      state.views.map((v) => v.id + ':' + v.name + ':' + v.tiles.length).join('|');
    if (wrap._sig === sig) return;
    wrap._sig = sig;
    const hadFocus = wrap.contains(document.activeElement);
    wrap.innerHTML = '';
    state.views.forEach((view) => {
      const tab = document.createElement('div');
      tab.className = 'tab';
      tab.setAttribute('role', 'tab');
      tab.dataset.view = view.id;
      tab.setAttribute('aria-selected', String(view.id === state.activeId));
      tab.tabIndex = view.id === state.activeId ? 0 : -1;
      tab.innerHTML =
        `<span class="tab-label" title="Double-click to rename">${esc(view.name)}</span>` +
        (view.tiles.length ? `<span class="tab-count">${view.tiles.length}</span>` : '') +
        (state.views.length > 1
          ? `<button class="tab-close" data-close-view aria-label="Close ${esc(view.name)}" title="Close view">${ICONS.close}</button>`
          : '');
      wrap.appendChild(tab);
    });
    if (hadFocus) {
      const active = wrap.querySelector('.tab[aria-selected="true"]');
      if (active) active.focus();
    }
  }

  function renderLayoutPicker() {
    const view = activeView();
    const host = $('#layoutPicker');
    if (host.children.length !== LAYOUT_ORDER.length) {
      host.innerHTML = '';
      LAYOUT_ORDER.forEach((key) => {
        const b = document.createElement('button');
        b.className = 'layout-opt';
        b.dataset.layout = key;
        b.title = `${LAYOUTS[key].cap}-up grid`;
        b.setAttribute('aria-label', `${LAYOUTS[key].cap}-up layout`);
        b.innerHTML = layoutIcon(key);
        host.appendChild(b);
      });
    }
    /* update in place: rebuilding on every render destroyed focus mid-keyboard-use */
    [...host.children].forEach((b, i) => {
      b.setAttribute('aria-pressed', String(view.layout === LAYOUT_ORDER[i]));
    });
    const trigger = $('#layoutBtn');
    if (trigger) {
      trigger.innerHTML = layoutIcon(view.layout);
      trigger.title = `${LAYOUTS[view.layout].cap}-up layout — pick 1, 2 or 4 screens`;
      trigger.setAttribute('aria-label', trigger.title);
    }
  }

  function closeLayoutMenu() {
    const wrap = $('.layout-wrap');
    if (wrap) wrap.classList.remove('is-open');
    const picker = $('#layoutPicker');
    if (picker) picker.hidden = true;
    const trigger = $('#layoutBtn');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function renderMuteAll() {
    const b = $('#muteAllBtn');
    const stateKey = state.muted ? 'off' : 'on';
    if (b._sig !== stateKey) {
      b._sig = stateKey;
      b.innerHTML = state.muted ? ICONS.volumeOff : ICONS.volume;
      b.title = state.muted ? 'Unmute all (M)' : 'Mute all (M)';
      b.setAttribute('aria-label', b.title);
      b.classList.toggle('is-on', !state.muted);
    }
  }

  /* ── grid rendering ────────────────────────────────────────── */

  function buildTileNode(tile) {
    const node = document.createElement('article');
    node.className = 'tile';
    node.dataset.id = tile.id;
    node.tabIndex = 0;
    node.setAttribute('role', 'group');
    node.innerHTML = `
      <div class="tile-head" aria-hidden="true">
        <span class="tile-head-dot"></span>
        <span class="tile-head-name"></span>
        <span class="tile-head-host"></span>
        <span class="tile-head-tag"></span>
      </div>
      <div class="tile-ui">
        <button class="tbtn tbtn-grip" data-drag aria-label="Move tile" title="Hold and drag to move">
          <span class="grip" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></span>
        </button>
        <button class="tbtn" data-act="audio" aria-pressed="false" title="Listen to this tile"></button>
        <button class="tbtn" data-act="mute" aria-pressed="false"></button>
        <button class="tbtn" data-act="cc" aria-pressed="false" title="Captions"></button>
        <button class="tbtn" data-act="reload" title="Reload tile">${ICONS.reload}</button>
        <button class="tbtn" data-act="popout" title="Detach to a window — use this if the tile shows a chat">${ICONS.popout}</button>
        <button class="tbtn" data-act="expand" title="Focus tile (F)"></button>
        <button class="tbtn" data-act="fullscreen" title="Fullscreen tile">${ICONS.fullscreen}</button>
        <button class="tbtn" data-act="info" title="Source info — where this comes from">${ICONS.info}</button>
        <button class="tbtn danger" data-act="close" title="Remove tile">${ICONS.close}</button>
      </div>
      <span class="tile-audio" aria-hidden="true">${ICONS.audio}<b>audio</b></span>
      <span class="tile-media-label" hidden></span>
      <div class="tile-body">
        <div class="tile-backdrop" aria-hidden="true"></div>
        <div class="tile-card">
          <div class="card-inner">
            <div class="card-icon">${ICONS.blocked}</div>
            <div class="card-title">This site won't play inside a tile</div>
            <div class="card-host"></div>
            <span class="card-badge" hidden>Login required</span>
            <p class="card-copy"></p>
            <div class="card-actions">
              <button class="btn primary" data-act="popout">Open window</button>
              <button class="btn" data-act="replace" hidden>Swap in live feed</button>
              <button class="btn" data-act="force">It's playing — keep it</button>
              <button class="btn ghost" data-act="close">Remove</button>
            </div>
          </div>
        </div>
        <div class="tile-media"></div>
        <div class="tile-poster" aria-hidden="true"></div>
        <div class="tile-boot" aria-hidden="true"><span class="tile-boot-name"></span></div>
        <div class="tile-shield" aria-hidden="true"></div>
        <iframe loading="lazy" sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock allow-presentation allow-orientation-lock allow-storage-access-by-user-activation"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write; screen-wake-lock"
          referrerpolicy="no-referrer-when-downgrade" title=""></iframe>
      </div>`;

    const frame = $('iframe', node);
    if (coverObserver) {
      const coverBody = $('.tile-body', node);
      if (coverBody) coverObserver.observe(coverBody);
    }
    frame.addEventListener('load', () => {
      frame.dataset.loads = String(Number(frame.dataset.loads || 0) + 1);
      if (!node._src || node._src === 'about:blank') return;
      const current = findTile(node.dataset.id);
      if (current) applyAudio(node, current);
      /* A YouTube document can finish loading while the player is still black.
         Keep the still up until the player reports that it is really playing. */
      if (!current || current.kind !== 'youtube') node.classList.remove('is-loading');

      node._loads = (node._loads || 0) + 1;

      const now = Date.now();
      if (!node._firstLoadAt) {
        node._firstLoadAt = now;
        return;
      }
      if (node._flagged) return;
      /* A second document load a moment later means the page redirected itself.
         Chat/landing redirects are the usual reason; flag it and remember the host. */
      if (now - node._firstLoadAt < 3500) {
        const tile = findTile(node.dataset.id);
        if (tile && tile.kind === 'generic' && !tile.force) {
          node._flagged = true;
          tile.redirected = true;
          learnWindowOnly(tile.host);
          save();
          renderGrid();
          toast(titleFor(tile) + ' left the tile on its own — from now on it opens in a window.', 'warn');
        }
      }
    });

    return node;
  }

  function startLoading(node) {
    node.classList.add('is-loading');
    clearTimeout(node._loadTimer);
    node._loadTimer = setTimeout(() => node.classList.remove('is-loading'), 12000);
  }

  /* ── direct-stream tiles (IPTV / Jellyfin) ─────────────────── */

  function destroyPlayer(node) {
    if (node._player) {
      try { node._player.destroy(); } catch { /* ignore */ }
      node._player = null;
    }
    node._playerUrl = null;
    const host = $('.tile-media', node);
    if (host) host.innerHTML = '';
  }

  function syncPlayer(node, tile) {
    const host = $('.tile-media', node);
    if (!host) return;
    const want = tile.media && tile.media.url ? tile.media.url : '';
    if (!want) { destroyPlayer(node); return; }

    if (node._player && node._playerUrl === want) {
      node._player.video.muted = !!tile.muted;
      return;
    }

    destroyPlayer(node);
    if (!window.MVLib) return;

    node.classList.add('is-loading');
    const player = window.MVLib.createPlayer(want, {
      muted: !!tile.muted,
      autoplay: true,
      onError: (message) => {
        node.classList.remove('is-loading');
        node.classList.add('has-media-error');
        const currentView = state.views.find((v) => v.tiles.includes(tile));
        if (currentView && replaceWithFallback(currentView, tile)) {
          toast('That stream failed — swapped in a live feed.', 'warn');
          return;
        }
        toast(titleFor(tile) + ': ' + message, 'warn');
      },
    });
    node._player = player;
    node._playerUrl = want;
    host.appendChild(player.video);
    player.video.addEventListener('loadedmetadata', () => node.classList.remove('is-loading'), { once: true });
    player.video.addEventListener('playing', () => node.classList.remove('is-loading'), { once: true });
    node.classList.remove('has-media-error');
  }

  function playerMessage(frame, payload) {
    if (!frame || !frame.contentWindow) return;
    try {
      frame.contentWindow.postMessage(typeof payload === 'string' ? payload : JSON.stringify(payload), '*');
    } catch { /* the player may not be ready yet */ }
  }

  function applyAudio(node, tile) {
    const frame = $('iframe', node);
    if (!frame || node._src === 'about:blank' || frame.hidden) return;
    if (tile.kind === 'youtube') {
      playerMessage(frame, { event: 'command', func: tile.muted ? 'mute' : 'unMute', args: [] });
    } else if (tile.kind === 'vimeo') {
      playerMessage(frame, { method: 'setMuted', value: !!tile.muted });
    } else if (tile.kind === 'twitch' || tile.kind === 'kick') {
      /* best-effort: these players may ignore the command, but they must not
         reload just because the audio focus moved. */
      playerMessage(frame, { event: 'command', func: tile.muted ? 'mute' : 'unMute', args: [] });
    }
  }

  /* Video tiles fill the tile edge-to-edge instead of letterboxing. A 16:9
     player inside a 1.8:1 tile gets scaled just enough to cover; the crop is a
     few pixels, never a black bar. */
  function fitTileCover(body) {
    if (!body) return;
    const tile = body.closest('.tile');
    if (!tile || !tile.classList.contains('is-cover')) {
      body.style.removeProperty('--cover');
      return;
    }
    const frame = $('iframe', body);
    if (!frame) return;
    const r = body.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const aspect = r.width / r.height;
    const live = findTile(tile.dataset.id);
    const target = (live && videoAspect.get(live.url)) || 16 / 9;
    /* A little extra zoom gives room to lift the player, which moves YouTube's
       own captions up off the bottom edge. 1.07 keeps the bottom covered. */
    const scale = Math.min(2.4, Math.max(1.07, Math.max(1, aspect / target, target / aspect) * 1.01));
    /* Tall tiles (2-up on a 16:9 screen) would need a 2x crop to cover, which
       cuts the captions off. Switch those to a contained player over a blurred
       still: the whole frame stays visible and captions sit above the bottom. */
    const fit = scale > 1.35;
    tile.classList.toggle('is-fit', fit);
    frame.style.transformOrigin = 'center center';
    if (fit) {
      /* Let CSS resolve the contained size against the real tile box, so a
         resize never leaves a stale pixel width behind. */
      frame.dataset.fit = aspect > target ? 'height' : 'width';
      frame.style.inset = 'auto';
      frame.style.left = '50%';
      frame.style.top = '50%';
      frame.style.width = '';
      frame.style.height = '';
      frame.style.transform = 'translate(-50%, -50%)';
      body.style.setProperty('--aspect', String(target));
      body.style.setProperty('--cover', '1');
      body.style.setProperty('--lift', '0%');
    } else {
      delete frame.dataset.fit;
      frame.style.inset = '0';
      frame.style.left = '';
      frame.style.top = '';
      frame.style.width = '';
      frame.style.height = '';
      frame.style.transform = '';
      body.style.setProperty('--cover', scale.toFixed(4));
      body.style.setProperty('--lift', '-3%');
    }
  }

  const coverObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver((entries) => entries.forEach((entry) => fitTileCover(entry.target)))
    : null;

  function updateTile(node, tile) {
    const title = titleFor(tile);
    const grip = $('[data-drag]', node);
    grip.title = `${title} — hold and drag to move`;
    grip.setAttribute('aria-label', `Move ${title}`);

    const unavailable = tile.kind === 'youtube' && !!tile.broken;
    const blocked = (tile.kind === 'blocked' && !tile.force) || unavailable;
    const redirected = !!tile.redirected && !tile.force;
    node.classList.toggle('is-blocked', blocked || redirected);
    node.classList.toggle('is-unavailable', unavailable);
    /* only clean 16:9 players are cropped to cover; a generic site keeps its UI */
    node.classList.toggle('is-cover', tile.kind === 'youtube' || tile.kind === 'vimeo');
    fitTileCover($('.tile-body', node));

    const poster = $('.tile-poster', node);
    const backdrop = $('.tile-backdrop', node);
    const posterId = tile.kind === 'youtube' ? ytVideoId(tile.url) : '';
    /* A local still fills every tile while its player boots — no black holes
       and no extra network request for live channels without a video id. */
    const art = posterId
      ? 'linear-gradient(180deg, rgba(6,10,18,.18), rgba(6,10,18,.55)), url("https://i.ytimg.com/vi/' + posterId + '/mqdefault.jpg"), url("media/hero/05.jpg")'
      : 'linear-gradient(180deg, rgba(6,10,18,.28), rgba(6,10,18,.66)), url("media/hero/05.jpg")';
    if (poster) poster.style.backgroundImage = art;
    if (backdrop) backdrop.style.backgroundImage = art;
    const bootName = $('.tile-boot-name', node);
    if (bootName) bootName.textContent = title;
    const headName = $('.tile-head-name', node);
    if (headName) {
      headName.textContent = title;
      $('.tile-head-host', node).textContent = tile.host || '';
      $('.tile-head-tag', node).textContent = blocked || redirected ? 'window' : (KIND_LABEL[tile.kind] || 'web');
      node.classList.toggle('head-window', blocked || redirected);
    }
    /* YouTube's own control bar cannot be styled away; hide it and shield the frame
       so hovering never reveals pause / fullscreen / title overlays. */
    node.classList.toggle('is-clean', tile.kind === 'youtube' && !blocked && !redirected);

    if (blocked || redirected) {
      $('.card-host', node).textContent = tile.host;
      if (unavailable) {
        $('.card-title', node).textContent = 'This video is unavailable';
        $('.card-copy', node).textContent = 'It was removed, made private, or its owner does not allow ' +
          'embedding. Open it on YouTube, reload, or swap in a live feed.';
      } else if (redirected && tile.reason === 'window-only') {
        $('.card-title', node).textContent = 'This site only plays in a window';
        $('.card-copy', node).textContent = 'Its player refuses to load inside a frame. ' +
          'Open it in a window — the stream and chat both work there.';
      } else if (redirected) {
        $('.card-title', node).textContent = 'This site leaves the tile';
        $('.card-copy', node).textContent = 'It redirects to its own page when framed, so the tile is stopped. ' +
          'It will open in a window automatically from now on.';
      } else if (isLoginHost(tile.host)) {
        $('.card-title', node).textContent = 'Sign in on its own page';
        $('.card-copy', node).textContent = `${blockedName(tile.host)} needs your own login and refuses to be framed. ` +
          'Open it in a window, sign in there, and watch with your own subscription.';
      } else {
        $('.card-title', node).textContent = "This site won't play inside a tile";
        $('.card-copy', node).textContent = tile.reason === 'channel'
          ? 'This channel is not in the app\'s handle list, so its page cannot be embedded. Open live page opens the channel in a window; a video link (youtube.com/watch?v=…) plays in a tile.'
          : `${blockedName(tile.host)} blocks embedding, so it can only live in its own window.`;
      }
      const login = isLoginHost(tile.host);
      const badge = $('.card-badge', node);
      if (badge) badge.hidden = !login;
      const forceBtn = $('.card-actions [data-act="force"]', node);
      if (forceBtn) forceBtn.hidden = login || unavailable;
      const popBtn = $('.card-actions [data-act="popout"]', node);
      if (popBtn) popBtn.textContent = unavailable
        ? 'Open on YouTube'
        : (login ? 'Open & sign in' : (tile.reason === 'channel' ? 'Open live page' : 'Open window'));
      const replaceBtn = $('.card-actions [data-act="replace"]', node);
      if (replaceBtn) replaceBtn.hidden = !unavailable;
    }

    const frame = $('iframe', node);
    frame.title = title;
    const isMedia = tile.kind === 'media';

    if (isMedia) {
      if (node._src !== 'about:blank') {
        node._src = 'about:blank';
        frame.src = 'about:blank';
      }
      frame.hidden = true;
      node.classList.remove('is-loading');
      syncPlayer(node, tile);
    } else {
      destroyPlayer(node);
      frame.hidden = false;

      if (blocked || redirected) {
        if (node._src !== 'about:blank') {
          node._src = 'about:blank';
          node.classList.remove('is-loading');
          frame.src = 'about:blank';
        }
      } else {
        const src = srcFor(tile);
        if (node._src !== src) {
          node._src = src;
          node._firstLoadAt = null;
          node._flagged = false;
          startLoading(node);
          clearTimeout(node._staggerTimer);
          const delay = node._loadDelay || 0;
          node._loadDelay = 0;
          if (delay) {
            node._staggerTimer = setTimeout(() => {
              if (!node.isConnected || node._src !== src) return;
              frame.src = src;
              startLoading(node);
            }, delay);
          } else {
            frame.src = src;
          }
          if (tile.kind === 'youtube') armYtHealth(node, tile);
        }
      }
    }

    const label = $('.tile-media-label', node);
    if (label) {
      const showLabel = isMedia || tile.kind === 'generic' || tile.kind === 'blocked';
      label.hidden = !showLabel;
      if (showLabel) label.textContent = (tile.media && tile.media.title) || title;
    }

    const muteBtn = $('[data-act="mute"]', node);
    const canMute = MUTABLE.has(tile.kind) || isMedia;
    muteBtn.hidden = !canMute;
    muteBtn.innerHTML = tile.muted ? ICONS.volumeOff : ICONS.volume;
    muteBtn.setAttribute('aria-pressed', String(tile.muted));
    muteBtn.title = tile.muted ? 'Unmute this tile' : 'Mute this tile';

    const ccBtn = $('[data-act="cc"]', node);
    const canCC = tile.kind === 'youtube';
    ccBtn.hidden = !canCC;
    ccBtn.innerHTML = ICONS.cc;
    ccBtn.setAttribute('aria-pressed', String(!!tile.cc));
    ccBtn.title = tile.cc ? 'Captions on — click to turn off' : 'Turn captions on (YouTube captions)';

    const expandBtn = $('[data-act="expand"]', node);
    expandBtn.innerHTML = focusedId === tile.id ? ICONS.collapse : ICONS.expand;
    expandBtn.title = focusedId === tile.id ? 'Back to the grid (Esc)' : 'Focus this tile (F)';

    const isAudio = activeView().audioFocus === tile.id;
    const audioBtn = $('[data-act="audio"]', node);
    audioBtn.innerHTML = ICONS.audio;
    audioBtn.setAttribute('aria-pressed', String(isAudio));
    audioBtn.title = isAudio ? 'Audio focus — other tiles muted' : 'Listen to this tile (mute the rest)';
    audioBtn.classList.toggle('is-audio', isAudio);
    node.classList.toggle('is-audio', isAudio);
    node.setAttribute('aria-label', `${title}${isAudio ? ' — audio focus' : ''}`);

    node.classList.toggle('is-focused', focusedId === tile.id);
    applyAudio(node, tile);
  }

  function buildAddNode() {
    const b = document.createElement('button');
    b.className = 'tile-add';
    b.type = 'button';
    b.innerHTML = `<span class="plus"><svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true"><path d="M10 4.5v11M4.5 10h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span><span>Add a link</span>`;
    b.addEventListener('click', focusInput);
    return b;
  }

  let addNode = null;

  function getAddNode() {
    if (!addNode) addNode = buildAddNode();
    return addNode;
  }

  /* ── motion (compositor-only, FLIP for layout swaps) ───────── */

  function reducedMotion() {
    try {
      const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      return Boolean(mq && mq.matches);
    } catch {
      return false;
    }
  }

  /** Layout box, deliberately unaffected by an in-flight transform. */
  function layoutBox(node) {
    return { x: node.offsetLeft, y: node.offsetTop, w: node.offsetWidth, h: node.offsetHeight };
  }

  /** Snapshot where everything sits before the DOM is reordered. */
  function snapshotRects(grid) {
    const rects = new Map();
    /* no point animating a wall nobody can see — and a hidden tab may not run
       requestAnimationFrame, which would leave the inverted transforms applied */
    if (reducedMotion() || document.hidden || !grid.offsetParent) return rects;
    [...grid.children].forEach((node) => {
      const box = layoutBox(node);
      if (box.w > 0 && box.h > 0) rects.set(node, box);
    });
    return rects;
  }

  /** Animate surviving tiles from their old box to the new one with transforms only. */
  function flipRects(grid, before) {
    if (!before.size) return;
    const moved = [];
    [...grid.children].forEach((node) => {
      const prev = before.get(node);
      if (!prev) return;
      /* offset-based box, so a rapid second layout click animates from the target box,
         not from wherever the first animation happened to be */
      const now = layoutBox(node);
      if (!now.w || !now.h) return;
      const dx = prev.x - now.x;
      const dy = prev.y - now.y;
      const sx = prev.w / now.w;
      const sy = prev.h / now.h;
      const still = Math.abs(dx) < .5 && Math.abs(dy) < .5 &&
        Math.abs(sx - 1) < .004 && Math.abs(sy - 1) < .004;
      if (still) return;
      node.style.transformOrigin = 'top left';
      node.style.transition = 'none';
      node.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
      node.classList.add('is-flipping');
      moved.push(node);
    });
    if (!moved.length) return;

    /* flush so the browser paints the inverted position before we animate */
    void grid.offsetWidth;
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      moved.forEach((node) => {
        node.style.transition = 'transform .34s cubic-bezier(.22, 1, .36, 1)';
        clearTimeout(node._flipTimer);
        node.style.transform = '';
        let done = false;
        const settle = () => {
          if (done) return;
          done = true;
          node.style.transition = '';
          node.style.transformOrigin = '';
          node.classList.remove('is-flipping');
          node.removeEventListener('transitionend', settle);
        };
        node.addEventListener('transitionend', settle);
        node._flipTimer = setTimeout(settle, 440);
      });
    };
    requestAnimationFrame(start);
    /* if the frame loop is throttled (background tab), settle anyway */
    setTimeout(start, 120);
  }

  function renderGrid() {
    const view = activeView();
    const grid = $('#grid');
    const L = LAYOUTS[view.layout] || LAYOUTS['4'];

    if (cinema && !view.tiles.length) setCinema(false);
    if (!view.tiles.length && document.body.classList.contains('is-moving')) setMoving(false);

    const before = snapshotRects(grid);
    let entering = 0;

    grid.style.setProperty('--cols', String(L.cols));
    grid.dataset.cols = String(L.cols);
    grid.classList.toggle('is-focus', Boolean(focusedId));
    $('#hero').hidden = view.tiles.length > 0;

    /* A layout is a screen count, not just a column count: show the first N tiles.
       Hidden tiles keep their place in the board and come back when the layout grows. */
    const visible = view.tiles.slice(0, L.cap);
    const ordered = focusedId
      ? view.tiles.filter((t) => t.id === focusedId)
      : visible;

    const desired = [];
    ordered.forEach((tile) => {
      let node = tileNodes.get(tile.id);
      if (!node) {
        node = buildTileNode(tile);
        const rawIndex = entering++;
        const enterIndex = Math.min(rawIndex, 6);
        node.style.setProperty('--enter', String(enterIndex));
        /* spread the first load of a batch so four players don't all boot at once */
        node._loadDelay = Math.min(rawIndex, 9) * 110;
        node.classList.add('is-entering');
        const body = $('.tile-body', node);
        if (body) {
          body.addEventListener('animationend', () => node.classList.remove('is-entering'), { once: true });
        }
        /* safety net: if the compositor never delivers animationend (throttled tab,
           animations suppressed), make the tile fully visible shortly after it lands */
        node._enterTimer = setTimeout(() => node.classList.remove('is-entering'), 1000 + enterIndex * 36);
        tileNodes.set(tile.id, node);
      }
      updateTile(node, tile);
      desired.push(node);
    });

    if (!focusedId && view.tiles.length > 0 && view.tiles.length < L.cap) {
      desired.push(getAddNode());
    }

    /* Reorder with the fewest possible moves so iframes don't needlessly reload. */
    let ref = grid.firstElementChild;
    desired.forEach((node) => {
      if (node === ref) {
        ref = ref.nextElementSibling;
      } else {
        grid.insertBefore(node, ref);
      }
    });

    /* Drop anything that is no longer wanted — including the previous view's
       tiles, so a hidden board can never keep streaming audio. */
    const keep = new Set(desired);
    [...grid.children].forEach((child) => {
      if (!keep.has(child)) {
        clearTimeout(child._loadTimer);
        clearTimeout(child._enterTimer);
        clearTimeout(child._flipTimer);
        clearTimeout(child._staggerTimer);
        if (coverObserver) {
          const coverBody = $('.tile-body', child);
          if (coverBody) coverObserver.unobserve(coverBody);
        }
        destroyPlayer(child);
        child.remove();
      }
    });
    [...tileNodes].forEach(([id, node]) => {
      if (!keep.has(node)) tileNodes.delete(id);
    });

    flipRects(grid, before);
    if (tvMode) focusTvTile(tvIndex);
  }

  function render() {
    renderTabs();
    renderLayoutPicker();
    renderMuteAll();
    /* Home is the landing: do not build the hidden wall (and its YouTube
       iframes) until the wall is actually shown. */
    if (currentView === 'wall') renderGrid();
  }

  function pushHistory(entry) {
    if (!entry || !entry.url) return;
    const item = {
      url: entry.url,
      title: String(entry.title || '').slice(0, 120),
      at: Date.now(),
      source: String(entry.source || 'web'),
    };
    state.history = [item, ...(state.history || []).filter((h) => h.url !== item.url)].slice(0, 24);
  }

  /** Direct streams (IPTV / Jellyfin) render in a real <video>, not an iframe. */
  function addMedia(media, options) {
    const opts = options || {};
    if (!window.MVLib) return null;
    const url = window.MVLib.safeUrl(media && media.url);
    if (!url) { toast('That stream URL is not valid.', 'err'); return null; }

    const view = activeView();
    if (view.tiles.length >= MAX_TILES) {
      toast(`A board holds ${MAX_TILES} tiles — make a new board for more.`, 'warn');
      return null;
    }

    const tile = {
      id: uid(),
      url: url,
      embed: null,
      kind: 'media',
      host: hostOf(url),
      name: '',
      muted: true,
      cc: false,
      force: false,
      reason: '',
      media: {
        url: url,
        title: String(media.title || '').slice(0, 120),
        group: String(media.group || '').slice(0, 60),
        source: media.source || 'iptv',
        itemId: media.itemId || '',
        hls: !!media.hls,
      },
    };

    view.tiles.push(tile);
    if (view.tiles.length > LAYOUTS[view.layout].cap) {
      const fit = LAYOUT_ORDER.find((key) => LAYOUTS[key].cap >= view.tiles.length);
      if (fit) view.layout = fit;
    }
    pushHistory({ url: url, title: tile.media.title, source: tile.media.source });
    save();
    render();
    if (opts.open !== false) showView('wall');
    return tile;
  }

  /* ── top-level views ───────────────────────────────────────── */

  let currentView = 'home';

  function showView(name) {
    closeChannels();
    if (!tvMode) stopKeyNav();
    currentView = ['home', 'sources', 'suggested'].includes(name) ? name : 'wall';
    document.body.dataset.view = currentView;
    $('#homeView').hidden = currentView !== 'home';
    $('#sourcesView').hidden = currentView !== 'sources';
    $('#suggestedView').hidden = currentView !== 'suggested';
    $('.pastebar').hidden = currentView !== 'wall';
    $('.stage').hidden = currentView !== 'wall';
    $$('#viewNav [data-view]').forEach((btn) => {
      /* aria-current, not aria-selected: these are nav buttons, not tabs */
      if (btn.dataset.view === currentView) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    if (currentView !== 'wall' && tvMode) {
      tvMode = false;
      document.body.classList.remove('is-tv');
      clearTimeout(tvHintTimer);
      const hint = $('#tvHint');
      if (hint) { hint.hidden = true; hint.classList.remove('is-hidden'); }
      clearTvFocus();
      syncTvUrl(false);
    }
    if (currentView === 'home' && window.MVDash) window.MVDash.renderHome();
    if (currentView === 'sources' && window.MVDash) window.MVDash.renderSources();
    if (currentView === 'suggested' && window.MVDash) window.MVDash.renderSuggested();
    if (currentView === 'wall') {
      renderGrid();
      showChrome();
      setTimeout(() => { if (currentView === 'wall') verifyCurated(activeView()); }, 1800);
    } else {
      clearTimeout(chromeTimer);
      document.body.classList.remove('chrome-hidden');
      const top = $('.topbar');
      const paste = $('.pastebar');
      if (top) top.inert = false;
      if (paste) paste.inert = false;
    }
  }

  /* ── actions ───────────────────────────────────────────────── */

  function addFromText(text) {
    const chunks = String(text || '').split(/[\s,]+/).filter(Boolean);
    if (!chunks.length) return false;

    const view = activeView();
    const seen = new Set(view.tiles.map((t) => t.url));
    let added = 0;
    let invalid = 0;
    let duplicates = 0;
    let overflow = 0;
    let genericAdded = false;
    const mustWindow = [];

    chunks.forEach((chunk) => {
      const tile = parseLink(chunk);
      if (!tile) { invalid++; return; }
      if (seen.has(tile.url)) { duplicates++; return; }
      if (windowOnly(tile.host)) { mustWindow.push(tile); return; }
      if (view.tiles.length >= MAX_TILES) { overflow++; return; }
      tile.muted = state.muted;
      tile.cc = !!state.ccDefault && tile.kind === 'youtube';
      view.tiles.push(tile);
      seen.add(tile.url);
      pushHistory({ url: tile.url, title: titleFor(tile), source: tile.kind });
      if (tile.kind === 'generic') genericAdded = true;
      added++;
    });

    mustWindow.forEach((tile) => {
      popout(tile, null);
      toast(`${titleFor(tile)} only plays in its own window — opened it there instead of a chat tile.`);
    });

    if (!added) {
      if (mustWindow.length) return true;
      if (invalid && !duplicates && !overflow) toast('That doesn\'t look like a link.', 'err');
      else if (duplicates && !overflow) toast('Already on this board.', 'warn');
      else if (overflow) toast(`A board holds ${MAX_TILES} tiles — make a new view for more.`, 'warn');
      return false;
    }

    /* Grow the layout if the new tiles no longer fit. */
    if (view.tiles.length > LAYOUTS[view.layout].cap) {
      const fit = LAYOUT_ORDER.find((key) => LAYOUTS[key].cap >= view.tiles.length);
      if (fit) view.layout = fit;
    }

    save();
    render();
    if (invalid) toast(`${invalid} link${invalid > 1 ? 's' : ''} skipped — not a URL.`, 'warn');

    if (genericAdded && !genericHintShown) {
      genericHintShown = true;
      setTimeout(() => {
        toast('If a site shows only a chat or a blank frame, use its pop-out button — some refuse to play when framed.');
      }, 700);
    }
    return true;
  }

  function removeTile(id) {
    const view = activeView();
    const i = view.tiles.findIndex((t) => t.id === id);
    if (i === -1) return;
    const node = tileNodes.get(id);
    if (node) destroyPlayer(node);
    view.tiles.splice(i, 1);
    const timers = ytTimers.get(id);
    if (timers) timers.forEach((t) => clearTimeout(t));
    ytTimers.delete(id);
    clearTimeout(ytEndTimers.get(id));
    ytEndTimers.delete(id);
    ytSkips.delete(id);
    if (view.audioFocus === id) view.audioFocus = null;
    if (focusedId === id) focusedId = null;
    tileNodes.delete(id);
    if (sourceTileId === id && $('#sourceDialog').open) $('#sourceDialog').close();
    save();
    render();
  }

  function toggleMute(id) {
    const tile = findTile(id);
    if (!tile) return;
    const isMedia = tile.kind === 'media';
    if (!isMedia && !MUTABLE.has(tile.kind)) return;
    tile.muted = !tile.muted;
    const view = activeView();
    view.audioFocus = null; /* a manual change ends the focus */
    save();
    if (isMedia) {
      const node = tileNodes.get(id);
      if (node) updateTile(node, tile);
      renderTabs();
    } else {
      renderGrid();
      renderTabs();
    }
  }

  function focusAudio(id) {
    const view = activeView();
    const tile = view.tiles.find((t) => t.id === id);
    if (!tile) return;

    if (view.audioFocus === id) {
      view.audioFocus = null;
      save();
      renderGrid();
      toast('Audio focus cleared.');
      return;
    }

    const controllable = MUTABLE.has(tile.kind) || tile.kind === 'media';
    tile.muted = false;

    let muted = 0;
    view.tiles.forEach((t) => {
      if (t.id === id) return;
      if (!MUTABLE.has(t.kind) && t.kind !== 'media') return;
      if (!t.muted) muted++;
      t.muted = true;
    });

    view.audioFocus = id;
    save();
    renderGrid();
    renderTabs();

    if (!controllable) {
      toast(`${titleFor(tile)} sets its own audio — every controllable tile is muted. If it stays silent, unmute inside its player.`, 'warn');
    } else if (muted) {
      toast(`Audio → ${titleFor(tile)}. ${muted} other tile${muted === 1 ? '' : 's'} muted.`);
    } else {
      toast(`Audio → ${titleFor(tile)}.`);
    }
  }

  function toggleMuteAll() {
    state.muted = !state.muted;
    state.views.forEach((v) => { v.audioFocus = null; });
    eachTile((t) => { t.muted = state.muted; });
    save();
    render();
    toast(state.muted ? 'All tiles muted.' : 'All tiles unmuted — one at a time is usually kinder.');
  }

  /* ── YouTube feed health ──────────────────────────────────────
     The iframe's "This video is unavailable" page is unreadable, but the player
     reports load errors through postMessage. Curated boards (Demo and presets)
     swap a failed feed for a verified one; ordinary boards show a clear card
     with reload / open-on-YouTube / swap actions instead of a dead frame. */

  const FALLBACK = {
    news: [
      'https://www.youtube.com/watch?v=6QFVhVT187M',   /* ABC News Live */
      'https://www.youtube.com/watch?v=Lhk3Gu0YeRs',   /* LiveNOW from FOX */
      'https://www.youtube.com/channel/UCIALMKvObZNtJ6AmdCLP7Lg/live', /* Bloomberg */
      'https://www.youtube.com/watch?v=q8Puv82CkFw', /* CBS News 24/7 */
    ],
    cartoons: [
      'https://www.youtube.com/watch?v=nIyaCRNwxhU',   /* Gumball */
      'https://www.youtube.com/watch?v=ALGbqW-tUAQ',   /* Tom & Jerry */
      'https://www.youtube.com/watch?v=3zcO7qaUiHs',   /* Disney Kids */
    ],
    camera: [
      'https://www.youtube.com/watch?v=ZxCeWQ3Lcig',   /* Times Square */
      'https://www.youtube.com/watch?v=q8Puv82CkFw', /* CBS News 24/7 */
    ],
    creators: [
      'https://www.youtube.com/playlist?list=PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf', /* MrBeast long-form */
      'https://www.youtube.com/playlist?list=UU513PdAP2-jWkJunTh5kXRw', /* Mark Rober */
      'https://www.youtube.com/playlist?list=UU4PooiX37Pld1T8J5SYT-SQ', /* GMM */
      'https://www.youtube.com/playlist?list=UUi7GJNg51C3jgmYTUwqoUXA', /* Conan */
    ],
    sports: [
      'https://www.youtube.com/watch?v=y-jR93AytPc',   /* NBA */
      'https://www.youtube.com/watch?v=QkGOollG-S4',   /* MLB */
      'https://www.youtube.com/watch?v=p4aNGqai4ec',   /* Premier League */
      'https://www.youtube.com/watch?v=ie920kzulsc',   /* Olympics */
      'https://www.youtube.com/watch?v=IIy0uIqFjb0',   /* UFC */
      'https://www.youtube.com/watch?v=MRO9RbJuZLg',   /* College football */
    ],
    esports: [
      'https://www.youtube.com/watch?v=Se6OL_DsGo8',
      'https://www.youtube.com/watch?v=kKXxKBT78XU',
      'https://www.youtube.com/watch?v=WuYwSxueXFY',
      'https://www.youtube.com/watch?v=LOmIAhhKKgU',
    ],
    comedy: [
      'https://www.youtube.com/watch?v=nztEvZDfOxI',
      'https://www.youtube.com/watch?v=ucbDHiBb47k',
      'https://www.youtube.com/watch?v=Dwti9AZsyLo',
      'https://www.youtube.com/watch?v=4In8wOZreGQ',
      'https://www.youtube.com/watch?v=NXrfWL6joj0',
      'https://www.youtube.com/watch?v=VDefM-uIbTU',
    ],
    learning: [
      'https://www.youtube.com/playlist?list=UUsT0YIqwnpJCM-mx7-gSA4Q',
      'https://www.youtube.com/playlist?list=UUq8ZAAsI89IoJ-fn1gYpO3g',
      'https://www.youtube.com/playlist?list=UU1UmujXTizWokDHojdEOdow',
      'https://www.youtube.com/playlist?list=UUtwKon9qMt5YLVgQt1tvJKg',
    ],
  };

  function fallbackPoolFor(tile) {
    const url = tile.url;
    const match = (ids) => ids.some((id) => url.includes(id));
    let key = 'news';
    if (match(['nIyaCRNwxhU', 'ALGbqW-tUAQ', '3zcO7qaUiHs', '4In8wOZreGQ', 'nztEvZDfOxI', 'ucbDHiBb47k', 'Dwti9AZsyLo', 'NXrfWL6joj0', 'VDefM-uIbTU'])) key = 'cartoons';
    else if (match(['Se6OL_DsGo8', 'kKXxKBT78XU', 'WuYwSxueXFY', 'LOmIAhhKKgU'])) key = 'esports';
    else if (match(['ZxCeWQ3Lcig'])) key = 'camera';
    else if (match(['PLoSWVnSA9vG8SK6-_45PAu6RVTaP1zXHf', 'UUX6OQ3DkcsbYNE6H8uQQuVA', 'UUIPPMRA040LQr5QPyJEbmXA', 'UU4PooiX37Pld1T8J5SYT-SQ', 'UUi7GJNg51C3jgmYTUwqoUXA', 'UU513PdAP2-jWkJunTh5kXRw', 'UUJrWyyCRROi8NlQ6Xd9dx5Q', 'UUh5mLn90vUaB1PbRRx_AiaA', 'UUGGZ_POGmIWG1pQXTDzQv-g', 'UU7oAKdhAM_ImxYOkLLPC9TQ'])) key = 'creators';
    else if (match(['y-jR93AytPc', 'QkGOollG-S4', 'p4aNGqai4ec', 'ie920kzulsc', 'IIy0uIqFjb0', 'MRO9RbJuZLg'])) key = 'sports';
    else if (match(['UUsT0YIqwnpJCM-mx7-gSA4Q', 'UUq8ZAAsI89IoJ-fn1gYpO3g', 'UU1UmujXTizWokDHojdEOdow', 'UUtwKon9qMt5YLVgQt1tvJKg', 'UU6nSFpj9HTCZ5t-N3Rm3-HA', 'UUG7J20LhUeLl6y_Emi7OJrA'])) key = 'learning';
    return FALLBACK[key].concat(FALLBACK.news, FALLBACK.camera, FALLBACK.cartoons, FALLBACK.creators);
  }
  const failedFeeds = new Set();
  const ytTimers = new Map();
  const feedChecks = new Map();
  /* URL → real video aspect, from YouTube oEmbed. A 4:3 feed needs a bigger
     crop than 16:9 to lose its pillarbox bars. */
  const videoAspect = new Map();
  const ytSkips = new Map();
  const ytEndTimers = new Map();

  function ytCommand(tile, func, args = []) {
    const node = tileNodes.get(tile.id);
    const frame = node && $('iframe', node);
    if (!frame) return;
    try {
      frame.contentWindow.postMessage(JSON.stringify({ event: 'command', func, args, id: tile.id }), '*');
    } catch { /* frame not ready */ }
  }

  /* Single videos loop via loop=1; this watchdog covers a player that stops on
     the end screen anyway. Playlists are left to YouTube's own auto-advance. */
  function watchVideoEnd(tile, info) {
    if (!info || !info.progressState) return;
    const ps = info.progressState;
    if (!ps.duration || ps.duration <= 0) return;
    const isList = (tile.embed && String(tile.embed).includes('videoseries')) || String(tile.url).includes('list=');
    if (isList) return;
    if (ps.current < ps.duration - 1.5) {
      clearTimeout(ytEndTimers.get(tile.id));
      ytEndTimers.delete(tile.id);
      return;
    }
    if (ytEndTimers.has(tile.id)) return;
    ytEndTimers.set(tile.id, setTimeout(() => {
      ytEndTimers.delete(tile.id);
      ytCommand(tile, 'seekTo', [0]);
      ytCommand(tile, 'playVideo');
    }, 900));
  }

  function maybeSkipShort(tile, info) {
    if (!tile.longform) return;
    const ps = info && info.progressState;
    if (!ps || typeof ps.duration !== 'number' || ps.duration <= 0) return;
    if (ps.duration >= tile.longform) {
      ytSkips.delete(tile.id);
      return;
    }
    if (ps.current && ps.current > 4) return;   /* only near the start */
    const n = ytSkips.get(tile.id) || 0;
    if (n >= 6) {
      if (n === 6) {
        ytSkips.set(tile.id, 7);
        toast('That playlist is mostly short clips — pick another one.', 'warn');
      }
      return;
    }
    ytSkips.set(tile.id, n + 1);
    ytCommand(tile, 'nextVideo');
  }

  function ytVideoId(url) {
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') return (u.pathname.split('/')[1] || '').slice(0, 11);
      const v = u.searchParams.get('v');
      if (v) return v.slice(0, 11);
      const m = u.pathname.match(/\/embed\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    } catch { /* ignore */ }
    return '';
  }

  function armYtHealth(node, tile) {
    if (tile.kind !== 'youtube') return;
    const frame = $('iframe', node);
    if (!frame) return;
    const previous = ytTimers.get(tile.id);
    if (previous) previous.forEach((t) => clearTimeout(t));
    const ping = () => {
      if (!node.isConnected || !node._src || node._src === 'about:blank') return;
      try {
        frame.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: tile.id, channel: 'widget' }), '*');
      } catch { /* frame not ready */ }
    };
    ytTimers.set(tile.id, [0, 700, 2200].map((ms) => setTimeout(ping, ms)));
  }

  function replaceWithFallback(view, tile) {
    if (!view) return false;
    const have = new Set(view.tiles.map((t) => t.url));
    const pool = fallbackPoolFor(tile).concat(demoLinksFor(9).split(' '));
    /* Prefer a feed the wall does not already show, then any feed that has
       not failed, then a known-good duplicate. A duplicate live feed is
       better than a dead tile. */
    let pick = pool.find((url) => !have.has(url) && !failedFeeds.has(url));
    if (!pick) pick = pool.find((url) => !failedFeeds.has(url));
    if (!pick) pick = pool[0];
    if (!pick) return false;
    const fresh = parseLink(pick);
    if (!fresh || fresh.kind !== 'youtube') return false;
    fresh.id = tile.id;                 /* keep the tile position and node */
    fresh.muted = !!tile.muted;
    fresh.cc = !!tile.cc;
    const i = view.tiles.indexOf(tile);
    if (i === -1) return false;
    view.tiles[i] = fresh;
    save();
    render();
    return true;
  }

  function handleYtError(tile, code) {
    if (!tile || tile.kind !== 'youtube' || tile.broken) return;
    failedFeeds.add(tile.url);
    const view = state.views.find((v) => v.tiles.includes(tile));
    if (!view) return;
    const curated = view.name === 'Demo' || !!view.preset;
    /* A pasted channel that is not live falls back to that channel's uploads
       before the generic live pool. */
    if (!curated && tile.liveFallback) {
      const fresh = parseLink(tile.liveFallback);
      if (fresh) {
        fresh.id = tile.id;
        fresh.muted = !!tile.muted;
        fresh.cc = !!tile.cc;
        view.tiles[view.tiles.indexOf(tile)] = fresh;
        save();
        render();
        toast('Channel is not live right now — playing its uploads instead.', 'warn');
        return;
      }
    }
    if (replaceWithFallback(view, tile)) {
      /* Several dead tiles often fail together; one message is enough. */
      if (Date.now() - lastSwapToastAt > 5000) {
        lastSwapToastAt = Date.now();
        toast('That feed was blocked — swapped in a live one.', 'warn');
      }
      return;
    }
    tile.broken = code || 1;
    save();
    renderGrid();
    toast('That video is unavailable — open it on YouTube or swap it.', 'warn');
  }

  function onYtMessage(event) {
    if (!/^https:\/\/(www\.|m\.)?youtube(-nocookie)?\.com$/.test(event.origin)) return;
    let data = event.data;
    if (typeof data === 'string') {
      try { data = JSON.parse(data); } catch { return; }
    }
    if (!data || !data.id) return;
    if (data.event === 'onReady') {
      const tile = findTile(data.id);
      if (!tile || tile.kind !== 'youtube') return;
      const node = tileNodes.get(tile.id);
      if (node) applyAudio(node, tile);
      return;
    }
    if (data.event === 'infoDelivery') {
      const tile = findTile(data.id);
      if (!tile || tile.kind !== 'youtube') return;
      /* Only accept a message that really came from this tile's player. */
      const node = tileNodes.get(tile.id);
      const frame = node && node.querySelector('iframe');
      if (!frame || event.source !== frame.contentWindow) return;
      const ps = data.info && data.info.playerState;
      if (ps === 1 || ps === 3) {
        node.classList.remove('is-loading');
        clearTimeout(node._loadTimer);
      }
      maybeSkipShort(tile, data.info);
      watchVideoEnd(tile, data.info);
      return;
    }
    if (data.event !== 'onError') return;
    const tile = findTile(data.id);
    if (!tile || tile.kind !== 'youtube') return;
    handleYtError(tile, Number(data.info) || 0);
  }

  /* A second net: oEmbed catches a removed, private or region-blocked upload
     before the player reports it. Every YouTube video is checked once per URL. */
  function verifyCurated(view) {
    if (!view || !view.tiles.length) return;
    view.tiles.forEach((tile) => {
      if (tile.kind !== 'youtube' || !ytVideoId(tile.url) || feedChecks.has(tile.url)) return;
      feedChecks.set(tile.url, true);
      fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent(tile.url), {
        mode: 'cors', credentials: 'omit',
      }).then((res) => {
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          const current = findTile(tile.id);
          if (current && current.url === tile.url) handleYtError(current, 100);
          return null;
        }
        return res.ok ? res.json() : null;
      }).then((data) => {
        if (!data || !data.width || !data.height) return;
        videoAspect.set(tile.url, data.width / data.height);
        const node = tileNodes.get(tile.id);
        if (node) fitTileCover($('.tile-body', node));
      }).catch(() => { feedChecks.delete(tile.url); });
    });
  }

  function reloadTile(id) {
    const tile = findTile(id);
    if (tile && tile.broken) {
      tile.broken = 0;
      failedFeeds.delete(tile.url);
      save();
      renderGrid();
      return;
    }
    const node = tileNodes.get(id);
    if (!node || node.classList.contains('is-blocked')) return;
    const frame = $('iframe', node);
    if (!frame || !node._src) return;
    const src = node._src;
    node._src = null;
    node._loadDelay = 0;
    clearTimeout(node._staggerTimer);
    frame.src = 'about:blank';
    setTimeout(() => {
      if (!node.isConnected) return;
      node._src = src;
      frame.src = src;
      startLoading(node);
    }, 40);
  }

  function reloadAll() {
    const tiles = activeView().tiles;
    tiles.forEach((t, i) => setTimeout(() => reloadTile(t.id), i * 120));
    if (tiles.length) toast(`Reloading ${tiles.length} tile${tiles.length > 1 ? 's' : ''}.`);
  }

  function popout(tile, node) {
    /* Open where the tile is, so the window reads as the tile leaving the wall. */
    const rect = node && node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    const chromeH = Math.max(0, window.outerHeight - window.innerHeight);
    let w = rect ? Math.round(rect.width) : Math.round(Math.min(screen.availWidth * 0.66, 1280));
    let h = rect ? Math.round(rect.height) : Math.round(Math.min(screen.availHeight * 0.76, 880));
    w = Math.min(Math.max(w, 480), 1600);
    h = Math.min(Math.max(h, 320), 1000);
    let left = rect ? Math.round(window.screenX + rect.left) : Math.round(Math.max(0, (screen.availWidth - w) / 2));
    let top = rect ? Math.round(window.screenY + chromeH + rect.top) : Math.round(Math.max(0, (screen.availHeight - h) / 2));
    left = Math.min(Math.max(left, 0), Math.max(0, screen.availWidth - w));
    top = Math.min(Math.max(top, 0), Math.max(0, screen.availHeight - h));
    const win = window.open(tile.url, 'mv_' + tile.id, `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
    if (!win) {
      toast('Popup blocked — allow popups for this page, then try again.', 'warn');
      return;
    }
    try { win.opener = null; } catch { /* ignore */ }
  }

  /* ── window wall ───────────────────────────────────────────── */

  const wallWindows = new Map();

  function wallStatus() {
    let open = 0;
    wallWindows.forEach((win) => { if (win && !win.closed) open++; });
    return { open, tiles: activeView().tiles.length };
  }

  function syncWallIndicator() {
    const btn = $('#popoutAllBtn');
    if (!btn) return;
    const open = wallStatus().open;
    btn.classList.toggle('has-windows', open > 0);
    btn.title = open ? open + ' window' + (open === 1 ? '' : 's') + ' open — window wall' : 'Window wall — open every tile as a window';
  }

  function closeWindowWall() {
    let closed = 0;
    wallWindows.forEach((win) => {
      try { if (win && !win.closed) { win.close(); closed++; } } catch (e) { /* ignore */ }
    });
    wallWindows.clear();
    syncWallIndicator();
    /* Deliberately no window.open('', name) sweep: with no existing window that
       creates a blank one. After a reload the old windows must be closed by hand. */
    return closed;
  }

  /**
   * Opens every tile on the board as a real window, laid out in a grid.
   * This is the only mode that works for sites whose players refuse frames.
   */
  function openWindowWall(preset) {
    const view = activeView();
    const tiles = view.tiles;
    if (!tiles.length) { toast('Add a link first — the window wall opens tiles.'); return { opened: 0, total: 0 }; }

    closeWindowWall();

    const auto = Math.ceil(Math.sqrt(tiles.length));
    const chosen = preset || view.wallPreset || 'auto';
    const dims = chosen === 'auto' ? [auto, Math.ceil(tiles.length / auto)] : chosen.split('x').map(Number);
    const cols = Math.max(1, dims[0] || auto);
    const rows = Math.max(1, dims[1] || Math.ceil(tiles.length / cols));

    const margin = 8;
    const chromeH = 92;
    const availW = screen.availWidth;
    const availH = screen.availHeight;
    const slotW = Math.floor((availW - margin * (cols + 1)) / cols);
    const slotH = Math.floor((availH - margin * (rows + 1)) / rows);
    const w = Math.max(360, Math.min(slotW, 1600));
    const h = Math.max(260, Math.min(slotH, 1200));

    let opened = 0;
    tiles.forEach((tile, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const left = Math.max(0, margin + col * (slotW + margin));
      const top = Math.max(0, margin + row * (slotH + margin));
      const win = window.open(tile.url, 'mv_' + tile.id,
        `popup=yes,width=${w},height=${h},left=${left},top=${top}`);
      if (win) {
        opened++;
        wallWindows.set(tile.id, win);
        try { win.opener = null; } catch (e) { /* ignore */ }
      }
    });

    view.wallPreset = chosen;
    save();
    syncWallIndicator();
    return { opened, total: tiles.length, cols, rows };
  }

  function setFocus(id) {
    if (id && !activeView().tiles.some((t) => t.id === id)) id = null;
    focusedId = id;
    if (id) lastTileId = id;
    renderGrid();
  }

  let cinema = false;
  let lastSwapToastAt = 0;
  let cinemaPeekTimer = 0;
  let tvMode = false;
  let keyNav = false;
  let tvIndex = 0;
  let tvHintTimer = 0;
  const PAGE_TITLE = document.title;

  function isTvUrl() {
    return /^\/tv(\.html)?\/?$/.test(location.pathname);
  }

  /* Keep the address bar on the clean /tv route. Query-string and hash links
     still work, but the canonical share URL is multiview.cc/tv. */
  function syncTvUrl(on) {
    document.title = on ? 'multiview tv' : PAGE_TITLE;
    if (!['/', '/index.html', '/tv', '/tv/'].includes(location.pathname)) return;
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    try {
      history.replaceState(null, '', on ? '/tv' : '/');
    } catch { /* file:// or a host that blocks history */ }
  }

  /* The address bar stays a clean path: multiview.cc/ or multiview.cc/tv —
     no query string, no hash, nothing after the slash. ?tv, ?home and #tv are
     read once at boot and then dropped. */
  function cleanBootUrl(tv) {
    if (!['/', '/index.html', '/tv', '/tv/'].includes(location.pathname)) return;
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    try {
      history.replaceState(null, '', tv ? '/tv' : '/');
    } catch { /* ignore */ }
  }

  /* ── TV mode ───────────────────────────────────────────────── */
  function tvNodes() {
    return [...document.querySelectorAll('#grid .tile')];
  }

  function tvCapacity() {
    const view = activeView();
    const L = LAYOUTS[view.layout] || LAYOUTS['4'];
    return Math.min(view.tiles.length, L.cap);
  }

  function clearTvFocus() {
    tvNodes().forEach((n) => n.classList.remove('tv-focused'));
  }

  /* Keyboard/TV navigation works on the wall by default, without first
     switching TV mode on. The ring only appears once an arrow key is used. */
  function startKeyNav() {
    if (tvMode) return;
    if (keyNav) return;
    keyNav = true;
    document.body.classList.add('is-keynav');
    focusTvTile(tvIndex);
  }

  function stopKeyNav() {
    if (!keyNav) return;
    keyNav = false;
    document.body.classList.remove('is-keynav');
    clearTvFocus();
  }

  function showTvHint() {
    if (!tvMode) return;
    const hint = $('#tvHint');
    if (!hint) return;
    hint.hidden = false;
    hint.classList.remove('is-hidden');
    clearTimeout(tvHintTimer);
    tvHintTimer = setTimeout(() => {
      if (tvMode) hint.classList.add('is-hidden');
    }, 6000);
  }

  function focusTvTile(index) {
    const view = activeView();
    const cap = tvCapacity();
    if (!cap) return;
    tvIndex = Math.max(0, Math.min(index, cap - 1));
    const wanted = view.tiles[tvIndex] && view.tiles[tvIndex].id;
    const nodes = tvNodes();
    nodes.forEach((n) => n.classList.toggle('tv-focused', n.dataset.id === wanted));
    const node = nodes.find((n) => n.dataset.id === wanted);
    if (node) node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  function moveTvFocus(key) {
    if (focusedId) return;
    const view = activeView();
    const cap = tvCapacity();
    if (!cap) return;
    const grid = $('#grid');
    const cols = grid
      ? (getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length ||
         (LAYOUTS[view.layout] || LAYOUTS['4']).cols)
      : (LAYOUTS[view.layout] || LAYOUTS['4']).cols;
    let next = tvIndex;
    if (key === 'ArrowLeft') next -= 1;
    if (key === 'ArrowRight') next += 1;
    if (key === 'ArrowUp') next -= cols;
    if (key === 'ArrowDown') next += cols;
    focusTvTile(Math.max(0, Math.min(next, cap - 1)));
  }

  async function copyLink() {
    const url = location.origin + location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied — send it to someone.');
      return true;
    } catch {
      toast(url);
      return false;
    }
  }

  function shareText() {
    return '4 streams. one screen. ' + location.origin + location.pathname;
  }

  function shareThreads() {
    const intent = 'https://www.threads.com/intent/post?text=' + encodeURIComponent(shareText());
    const win = window.open(intent, '_blank', 'noopener,noreferrer,width=640,height=720');
    if (!win) {
      copyLink();
      toast('Pop-up blocked — link copied instead.', 'warn');
    }
  }

  async function shareNative() {
    const url = location.origin + location.pathname;
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: 'multiview.cc', text: '4 streams. one screen.', url });
      const dialog = $('#shareDialog');
      if (dialog && dialog.open) dialog.close();
      return true;
    } catch (err) {
      if (err && err.name === 'AbortError') return false;
      return copyLink();
    }
  }

  function openShare() {
    const dialog = $('#shareDialog');
    if (!dialog) return shareNative();
    const native = $('#shareNativeBtn');
    if (native) native.hidden = !navigator.share;
    if (!dialog.open) dialog.showModal();
    return true;
  }

  function setTvMode(on) {
    if (on) {
      keyNav = false;
      document.body.classList.remove('is-keynav');
      document.querySelectorAll('dialog[open]').forEach((d) => d.close());
      const more = $('#moreMenu');
      if (more) more.hidden = true;
      const moreBtn = $('#moreBtn');
      if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
      closeLayoutMenu();
      closeChannels();
      if (!activeView().tiles.length) setupDemo(4);
      else showView('wall');
      tvMode = true;
      document.body.classList.add('is-tv');
      tvIndex = 0;
      focusTvTile(0);
      showTvHint();
      showChrome();
      syncTvUrl(true);
      toast('TV mode — arrows move, Enter focuses, Y exits.');
    } else {
      tvMode = false;
      keyNav = false;
      document.body.classList.remove('is-tv', 'is-keynav');
      clearTimeout(tvHintTimer);
      const hint = $('#tvHint');
      if (hint) { hint.hidden = true; hint.classList.remove('is-hidden'); }
      clearTvFocus();
      showChrome();
      syncTvUrl(false);
      toast('TV mode off.');
    }
  }
  const AUTO_HIDE_MS = 5000;
  let chromeTimer = 0;

  function updateAutoHideButton() {
    const btn = $('#autoHideBtn');
    if (btn) btn.setAttribute('aria-pressed', String(state ? state.autoHide !== false : true));
  }

  function canAutoHide() {
    if (currentView !== 'wall' || cinema || !state || state.autoHide === false) return false;
    if (!activeView().tiles.length) return false;
    if (document.querySelector('dialog[open]')) return false;
    const menu = $('#moreMenu');
    if (menu && !menu.hidden) return false;
    const layout = $('#layoutPicker');
    if (layout && !layout.hidden) return false;
    if (document.body.classList.contains('is-moving') || document.body.classList.contains('is-dragging-tile')) return false;
    if (document.body.classList.contains('channels-open')) return false;
    const active = document.activeElement;
    if (active && active.matches && active.matches('input, textarea, [contenteditable="true"]')) return false;
    return true;
  }

  function showChrome(schedule = true) {
    document.body.classList.remove('chrome-hidden');
    const top = $('.topbar');
    const paste = $('.pastebar');
    if (top) top.inert = false;
    if (paste) paste.inert = false;
    clearTimeout(chromeTimer);
    if (schedule && state && state.autoHide !== false && currentView === 'wall') {
      chromeTimer = setTimeout(hideChrome, AUTO_HIDE_MS);
    }
  }

  function hideChrome(force) {
    if (!force && !canAutoHide()) return;
    if (currentView !== 'wall' || cinema) return;
    const top = $('.topbar');
    const paste = $('.pastebar');
    document.body.classList.add('chrome-hidden');
    if (top) top.inert = true;
    if (paste) paste.inert = true;
  }

  function toggleAutoHide() {
    if (!state) return;
    state.autoHide = state.autoHide === false;
    save();
    updateAutoHideButton();
    showChrome();
    toast(state.autoHide ? 'Controls hide after 5 seconds of inactivity.' : 'Controls stay visible.');
  }

  /* ── channels sidebar ──────────────────────────────────────── */

  function openChannels() {
    const drawer = $('#channelDrawer');
    const backdrop = $('#channelBackdrop');
    const btn = $('#channelsBtn');
    if (!drawer) return;
    if (window.MVDash && typeof window.MVDash.renderChannels === 'function') {
      window.MVDash.renderChannels();
    }
    drawer.hidden = false;
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add('channels-open');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    showChrome();
    setTimeout(() => {
      const search = $('#channelSearch');
      if (search) search.focus();
    }, 40);
  }

  function closeChannels() {
    const drawer = $('#channelDrawer');
    const backdrop = $('#channelBackdrop');
    const btn = $('#channelsBtn');
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('channels-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleChannels() {
    const drawer = $('#channelDrawer');
    if (!drawer) return;
    if (drawer.hidden) openChannels();
    else closeChannels();
  }

  function setCinema(on) {
    if (on && !activeView().tiles.length) {
      toast('Add a tile first — cinema mode hides the controls.');
      return;
    }
    cinema = on;
    document.body.classList.toggle('is-cinema', on);
    document.body.classList.remove('cinema-peek');
    clearTimeout(cinemaPeekTimer);
    if (on) {
      clearTimeout(chromeTimer);
      document.body.classList.remove('chrome-hidden');
      /* Flash the exit pill so it is obvious how to get out. */
      document.body.classList.add('cinema-peek');
      cinemaPeekTimer = setTimeout(() => {
        if (cinema) document.body.classList.remove('cinema-peek');
      }, 3200);
    } else {
      showChrome();
    }
    if (on) toast('Cinema mode — press Esc or H, or move the pointer, to get the controls back.');
  }

  /* ── inline rename ─────────────────────────────────────────── */

  function inlineEdit(el, { value, max = 60, onDone }) {
    const original = value;
    el.textContent = original;
    el.setAttribute('contenteditable', 'plaintext-only');
    if (!el.isContentEditable) el.setAttribute('contenteditable', 'true');
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    let finished = false;
    const finish = (commit) => {
      if (finished) return;
      finished = true;
      el.removeAttribute('contenteditable');
      const next = el.textContent.replace(/\s+/g, ' ').trim().slice(0, max);
      el.textContent = commit && next ? next : original;
      el.removeEventListener('keydown', onKey);
      el.removeEventListener('blur', onBlur);
      onDone(commit && next ? next : original);
    };
    const onKey = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
      e.stopPropagation();
    };
    const onBlur = () => finish(true);
    el.addEventListener('keydown', onKey);
    el.addEventListener('blur', onBlur);
  }

  /* ── dialogs ───────────────────────────────────────────────── */

  const SOURCES = [
    {
      group: 'Providers',
      hint: 'The live sample adds a working tile. The rest open the provider so you can pick a stream and paste its link.',
      rows: [
        { name: 'YouTube live', note: 'Live news sample, plays in a tile', url: 'https://www.youtube.com/channel/UCNye-wNBqNL5ZzHSJj3l8Bg/live', frame: true },
        { name: 'YouTube', note: 'Browse videos and channels', url: 'https://www.youtube.com/', frame: false },
        { name: 'Twitch', note: 'Browse live channels', url: 'https://www.twitch.tv/directory', frame: false },
        { name: 'Kick', note: 'Browse live channels', url: 'https://kick.com/category/livestream', frame: false },
        { name: 'Rumble', note: 'Browse videos + live', url: 'https://rumble.com/browse', frame: false },
        { name: 'Vimeo', note: 'Browse videos', url: 'https://vimeo.com/watch', frame: false },
        { name: 'Dailymotion', note: 'Browse videos', url: 'https://www.dailymotion.com/', frame: false },
        { name: 'Samsung TV Plus', note: 'Free live TV, opens in a window', url: 'https://www.samsungtvplus.com/', frame: false },
        { name: 'Pluto TV', note: 'Free live TV, opens in a window', url: 'https://pluto.tv/', frame: false },
        { name: 'Tubi', note: 'Free movies + live, opens in a window', url: 'https://tubitv.com/', frame: false },
      ],
    },
    {
      group: 'Your subscriptions',
      hint: 'Use your own login. These use DRM and refuse to be framed, so they open in a window.',
      rows: [
        { name: 'Hulu', note: 'Subscription', url: 'https://www.hulu.com/', frame: false },
        { name: 'Disney+', note: 'Subscription', url: 'https://www.disneyplus.com/', frame: false },
        { name: 'Netflix', note: 'Subscription', url: 'https://www.netflix.com/', frame: false },
        { name: 'Prime Video', note: 'Subscription', url: 'https://www.primevideo.com/', frame: false },
        { name: 'Max', note: 'Subscription', url: 'https://www.max.com/', frame: false },
        { name: 'Fox', note: 'Subscription / TV provider', url: 'https://www.fox.com/', frame: false },
        { name: 'Peacock', note: 'Subscription', url: 'https://www.peacocktv.com/', frame: false },
        { name: 'Paramount+', note: 'Subscription', url: 'https://www.paramountplus.com/', frame: false },
        { name: 'Apple TV', note: 'Subscription', url: 'https://tv.apple.com/', frame: false },
      ],
    },
    {
      group: 'Live TV & sport',
      hint: 'These open in a window — their players refuse frames. Pasting any other index link works the same way.',
      rows: [
        { name: 'DaddyLive', note: 'TV + sport, channel list', url: 'https://dlive.sx/24-7-channels.php', frame: true },
        { name: 'StreamCorner', note: 'Redirects when framed', url: 'https://streamcorner.st/', frame: true },
        { name: 'StreamSports99', note: 'TV + sport, mirrors rotate', url: 'https://streamsports99.ru/live-tv', frame: true },
        { name: 'SportsBite', note: 'Sport channels', url: 'https://sportsbite.org/channels', frame: true },
        { name: 'NTV', note: 'TV + sport', url: 'https://ntv.st/', frame: true },
        { name: 'Famelack', note: 'Globe-style channel browser', url: 'https://famelack.com/', frame: true },
        { name: '90 Minutes', note: 'Sport', url: 'https://90minutes.pro/', frame: true },
        { name: 'zlive', note: 'TV + sport', url: 'https://zlive.st/', frame: true },
        { name: 'Live24', note: 'TV + sport', url: 'https://livelive24.com/', frame: true },
        { name: 'WatchTVs', note: 'TV', url: 'https://watchtvs.live/', frame: true },
        { name: 'TV247US', note: 'TV', url: 'https://tvnow247.top/', frame: true },
        { name: 'TV Explorer', note: 'TV + sport', url: 'https://tvexplorer.live/', frame: true },
        { name: 'xyzstreams', note: 'TV + sport', url: 'https://xyzstreams.st/', frame: true },
        { name: 'FreeTVGarden', note: 'TV + sport', url: 'https://freetvgarden.com/', frame: true },
        { name: 'kool.to', note: 'European TV + sport', url: 'https://kool.ws/', frame: true },
        { name: '1Tube', note: 'TV + sport', url: 'https://1tube.org/live-tv', frame: true },
        { name: 'DamiTV', note: 'Allows only its own domains', url: 'https://damitv.st/livetv', frame: false },
        { name: 'CXtv', note: 'Sends SAMEORIGIN', url: 'https://www.cxtvlive.com/', frame: false },
        { name: 'IPTV Web', note: 'Sends SAMEORIGIN', url: 'https://iptv-web.app/', frame: false },
        { name: 'TVNow', note: 'Sends X-Frame-Options: DENY', url: 'https://tvnow.st/', frame: false },
      ],
    },
    {
      group: 'Needs its own window',
      hint: 'Major broadcasters — X-Frame-Options / CSP, no way around it.',
      rows: [
        { name: 'ESPN', note: 'Watch + ESPN+', url: 'https://www.espn.com/watch', frame: false },
        { name: 'NBA', note: 'League Pass', url: 'https://www.nba.com/watch', frame: false },
        { name: 'NFL', note: 'NFL+', url: 'https://www.nfl.com/', frame: false },
        { name: 'MLB', note: 'MLB.TV', url: 'https://www.mlb.com/tv', frame: false },
        { name: 'NHL', note: 'NHL.tv', url: 'https://www.nhl.com/', frame: false },
        { name: 'F1 TV', note: 'Live timing + streams', url: 'https://f1tv.formula1.com', frame: false },
        { name: 'DAZN', note: 'Boxing, football', url: 'https://www.dazn.com', frame: false },
        { name: 'Peacock', note: 'Premier League, NFL', url: 'https://www.peacocktv.com', frame: false },
        { name: 'Prime Video', note: 'NFL, tennis', url: 'https://www.primevideo.com', frame: false },
        { name: 'YouTube TV', note: 'Live channels', url: 'https://tv.youtube.com', frame: false },
        { name: 'Hulu + Live TV', note: 'US live TV', url: 'https://www.hulu.com/live-tv', frame: false },
        { name: 'Sling', note: 'US live TV', url: 'https://www.sling.com', frame: false },
        { name: 'Max', note: 'US sports add-on', url: 'https://www.max.com', frame: false },
        { name: 'Paramount+', note: 'CBS sports', url: 'https://www.paramountplus.com', frame: false },
        { name: 'Sky Sports', note: 'UK', url: 'https://www.skysports.com', frame: false },
        { name: 'TNT Sports', note: 'UK / US', url: 'https://www.tntsports.co.uk', frame: false },
        { name: 'TSN', note: 'Canada', url: 'https://www.tsn.ca', frame: false },
        { name: 'Sportsnet', note: 'Canada', url: 'https://www.sportsnet.ca', frame: false },
        { name: 'Kayo', note: 'Australia', url: 'https://kayosports.com.au', frame: false },
        { name: 'SuperSport', note: 'Africa', url: 'https://supersport.com', frame: false },
      ],
    },
  ];

  function renderSources() {
    const body = $('#sourcesBody');
    body.innerHTML = SOURCES.map((group) => {
      const entries = group.rows.map((row) => ({
        row,
        asTile: row.frame && !windowOnly(hostOf(row.url)),
      }));
      /* everything that actually embeds goes first; window-only sites are grouped below */
      const tiles = entries.filter((e) => e.asTile);
      const windows = entries.filter((e) => !e.asTile);

      const renderRow = ({ row, asTile }) => `
        <button class="src-row ${asTile ? 'yes' : 'no'}"
          ${asTile ? `data-add-url="${esc(row.url)}"` : `data-url="${esc(row.url)}"`}
          title="${asTile ? `Add ${esc(row.name)} to this board` : `Open ${esc(row.name)} in a window`}">
          <span class="src-dot" aria-hidden="true"></span>
          <span class="src-name">${esc(row.name)}</span>
          <span class="src-note">${esc(row.note)}</span>
          <span class="src-act">${asTile ? '+ Tile' : '↗ Window'}</span>
        </button>`;

      return `<section class="src-group">
        <h3>${esc(group.group)}</h3>
        <p class="sheet-sub" style="margin:-2px 0 7px 8px">${esc(group.hint)}</p>
        <div class="src-list">${tiles.map(renderRow).join('')}</div>
        ${windows.length ? (tiles.length ? '<p class="src-sub">Opens in a window</p>' : '') + `<div class="src-list">${windows.map(renderRow).join('')}</div>` : ''}
      </section>`;
    }).join('');
  }

  /* ── board export / import ─────────────────────────────────── */

  function exportBoard(view) {
    return {
      app: 'multiview.cc',
      version: 1,
      board: {
        name: view.name,
        layout: view.layout,
        tiles: view.tiles.map((t) => ({
          url: t.url,
          muted: !!t.muted,
          cc: !!t.cc,
          shuffle: Number.isInteger(t.shuffle) ? t.shuffle : (t.embed && String(t.embed).includes('videoseries') ? playlistStart() : 0),
          force: !!t.force,
        })),
      },
    };
  }

  function b64encode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64decode(str) {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function shareLink(payload) {
    return `${location.origin}${location.pathname}#b=${b64encode(JSON.stringify(payload))}`;
  }

  /** Re-validates everything: URLs are re-parsed, never trusted from the file. */
  function parseBoardText(text) {
    const sourceText = String(text || '');
    if (sourceText.length > 200 * 1024) return { error: 'That board is too big to import.' };
    let rawText = sourceText.trim();
    if (!rawText) return { error: 'Paste a share code first.' };

    if (/^https?:\/\//i.test(rawText)) {
      try {
        const u = new URL(rawText);
        const m = u.hash.match(/[#&]b=([^&]+)/);
        if (!m) return { error: 'That link does not contain a board.' };
        rawText = b64decode(decodeURIComponent(m[1]));
      } catch {
        return { error: 'That link could not be read.' };
      }
    }

    let data;
    try { data = JSON.parse(rawText); } catch { return { error: 'That is not valid JSON or a board link.' }; }
    if (!data || typeof data !== 'object') return { error: 'No board found in that code.' };

    const raw = data.board && typeof data.board === 'object' ? data.board : data;
    if (!Array.isArray(raw.tiles)) return { error: 'That board has no tile list.' };
    if (raw.tiles.length > MAX_TILES) {
      return { error: `That board has ${raw.tiles.length} tiles — the limit is ${MAX_TILES}.` };
    }

    const tiles = [];
    let skipped = 0;
    raw.tiles.forEach((entry) => {
      const url = typeof entry === 'string'
        ? entry
        : entry && typeof entry.url === 'string' ? entry.url : null;
      if (!url || url.length > 4096) { skipped++; return; }
      const tile = parseLink(url);
      if (!tile) { skipped++; return; }
      if (entry && typeof entry === 'object') {
        if (typeof entry.muted === 'boolean') tile.muted = entry.muted;
        tile.cc = Boolean(entry.cc) && tile.kind === 'youtube';
        tile.force = Boolean(entry.force);
      }
      tiles.push(tile);
    });

    if (!tiles.length) return { error: 'None of the links in that board could be read.' };

    let layout = LAYOUTS[raw.layout] ? String(raw.layout) : null;
    if (!layout || LAYOUTS[layout].cap < tiles.length) {
      layout = LAYOUT_ORDER.find((key) => LAYOUTS[key].cap >= tiles.length) || '4';
    }

    const name = typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim().replace(/\s+/g, ' ').slice(0, 40)
      : 'Imported board';

    return { board: { name, layout, tiles }, skipped };
  }

  function uniqueBoardName(base) {
    const names = new Set(state.views.map((v) => v.name));
    if (!names.has(base)) return base;
    let n = 2;
    while (names.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
  }

  function applyImport(board, replace) {
    if (replace) {
      const view = activeView();
      view.name = board.name;
      view.layout = board.layout;
      view.tiles = board.tiles;
      view.audioFocus = null;
    } else {
      const view = makeView(uniqueBoardName(board.name));
      view.layout = board.layout;
      view.tiles = board.tiles;
      state.views.push(view);
      state.activeId = view.id;
    }
    focusedId = null;
    save();
    render();
  }

  function refreshImportPreview() {
    const text = $('#importInput').value;
    const err = $('#importError');
    const prev = $('#importPreview');
    const btn = $('#importBtn');

    if (!text.trim()) {
      err.hidden = true;
      prev.hidden = true;
      btn.disabled = true;
      return null;
    }

    const result = parseBoardText(text);
    if (result.error) {
      prev.hidden = true;
      err.textContent = result.error;
      err.hidden = false;
      btn.disabled = true;
      return null;
    }

    err.hidden = true;
    const b = result.board;
    const hosts = [...new Set(b.tiles.map((tile) => tile.host).filter(Boolean))];
    const hostLine = hosts.slice(0, 3).join(', ') + (hosts.length > 3 ? ` +${hosts.length - 3}` : '');
    prev.textContent = `${b.name} · ${b.tiles.length} tile${b.tiles.length === 1 ? '' : 's'} · ${LAYOUTS[b.layout].cap}-up` +
      (hostLine ? ` · ${hostLine}` : '') +
      (result.skipped ? ` · ${result.skipped} skipped` : '');
    prev.title = hosts.join('\n');
    prev.hidden = false;
    btn.disabled = false;
    return result;
  }

  function openBoardDialog(prefill) {
    const view = activeView();
    const n = view.tiles.length;
    $('#boardMeta').textContent = `${view.name} · ${n} tile${n === 1 ? '' : 's'} · ${LAYOUTS[view.layout].cap}-up`;
    $('#importInput').value = prefill || '';
    $('#importReplace').checked = false;
    $('#importError').hidden = true;
    $('#importPreview').hidden = true;
    $('#importBtn').disabled = true;
    if (prefill) refreshImportPreview();
    openSheet($('#boardDialog'));
  }

  function wireBoardSharing() {
    $('#boardBtn').addEventListener('click', () => openBoardDialog());

    $('#exportCopy').addEventListener('click', async () => {
      const text = JSON.stringify(exportBoard(activeView()), null, 2);
      try {
        await navigator.clipboard.writeText(text);
        toast('Share code copied.');
      } catch {
        $('#importInput').value = text;
        $('#importInput').select();
        toast('Clipboard blocked — the code is selected, press ⌘C.', 'warn');
      }
    });

    $('#exportLink').addEventListener('click', async () => {
      if (!/^https?:$/.test(location.protocol)) {
        toast('Links need the localhost server, not a file:// path.', 'warn');
        return;
      }
      const link = shareLink(exportBoard(activeView()));
      try {
        await navigator.clipboard.writeText(link);
        toast(link.length > 1800
          ? 'Link copied — it is long, so a chat app may trim it. The share code is safer.'
          : 'Board link copied.');
      } catch {
        toast('Clipboard blocked by the browser.', 'warn');
      }
    });

    $('#exportFile').addEventListener('click', () => {
      const payload = exportBoard(activeView());
      const slug = payload.board.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'board';
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${slug}.multiview.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Board downloaded.');
    });

    $('#importInput').addEventListener('input', refreshImportPreview);

    $('#importFileBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 200 * 1024) { toast('That file is too big to be a board.', 'warn'); return; }
      $('#importInput').value = await file.text();
      refreshImportPreview();
      e.target.value = '';
    });

    $('#importBtn').addEventListener('click', () => {
      const result = parseBoardText($('#importInput').value);
      if (result.error) {
        $('#importError').textContent = result.error;
        $('#importError').hidden = false;
        return;
      }
      const replace = $('#importReplace').checked;
      applyImport(result.board, replace);
      $('#importInput').value = '';
      $('#boardDialog').close();
      toast(replace ? `Replaced this board with “${result.board.name}”.` : `Added “${result.board.name}” as a new board.`);
      if (result.skipped) {
        toast(`${result.skipped} link${result.skipped === 1 ? '' : 's'} skipped — not valid URLs.`, 'warn');
      }
    });
  }

  function openSheet(dialog) {
    if (!dialog.open) dialog.showModal();
    const body = dialog.querySelector('.sheet-body');
    if (body) {
      body.tabIndex = -1;
      body.focus({ preventScroll: true });
    }
  }

  function setHelpTab(name) {
    $$('[data-help-tab]').forEach((btn) => {
      const on = btn.dataset.helpTab === name;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
    });
    const keys = $('#helpKeys');
    const faq = $('#helpFaq');
    if (keys) keys.hidden = name !== 'keys';
    if (faq) faq.hidden = name !== 'faq';
  }

  function wireDialogs() {
    renderSources();

    $$('[data-help-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setHelpTab(btn.dataset.helpTab));
    });

    /* source inspector */
    $$('[data-source-tab]').forEach((btn) => {
      btn.addEventListener('click', () => { sourceTab = btn.dataset.sourceTab; renderSource(); });
    });
    $('#sourceDialog .sheet-tabs').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const order = $$('[data-source-tab]').map((b) => b.dataset.sourceTab);
      const current = Math.max(0, order.indexOf(sourceTab));
      const step = e.key === 'ArrowRight' ? 1 : order.length - 1;
      const next = order[(current + step) % order.length];
      sourceTab = next;
      renderSource();
      $(`[data-source-tab="${next}"]`).focus();
    });
    const sourceDialogEl = $('#sourceDialog');
    const clearSourceSelection = () => {
      if (sourceDialogEl.open) return;
      sourceTileId = null;
      markSelected();
    };
    sourceDialogEl.addEventListener('close', clearSourceSelection);
    /* some environments don't deliver dialog 'close'; watch the attribute too */
    new MutationObserver(clearSourceSelection).observe(sourceDialogEl, {
      attributes: true,
      attributeFilter: ['open'],
    });
    $('#sourceBody').addEventListener('click', async (e) => {
      const act = e.target.closest('[data-src-act]');
      if (!act) return;
      const tile = findTile(sourceTileId);
      if (!tile) return;
      const action = act.dataset.srcAct;
      if (action === 'copy') {
        try {
          await navigator.clipboard.writeText(tile.url);
          toast('Link copied.');
        } catch {
          toast('Could not copy — select the URL in the panel instead.', 'warn');
        }
      } else if (action === 'open') {
        const win = window.open(tile.url, '_blank');
        if (win) { try { win.opener = null; } catch { /* ignore */ } }
        else toast('Popup blocked — allow it for this page.', 'warn');
      } else if (action === 'window') {
        popout(tile);
        $('#sourceDialog').close();
      } else if (action === 'reload') {
        reloadTile(tile.id);
        toast('Reloading ' + titleFor(tile) + '.');
      } else if (action === 'headers') {
        checkHeaders(tile);
      } else if (action === 'toggle-headers') {
        toggleHeaders(Boolean(act.checked));
      } else if (action === 'use-title') {
        if (sourceMeta && sourceMeta.title) {
          tile.name = String(sourceMeta.title).slice(0, 90);
          save();
          render();
          renderSource();
          toast('Tile renamed.');
        }
      }
    });

    $('#helpDialog .sheet-tabs').addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const order = $$('[data-help-tab]').map((b) => b.dataset.helpTab);
      const current = order.indexOf($('.sheet-tab.is-active').dataset.helpTab);
      const step = e.key === 'ArrowRight' ? 1 : order.length - 1;
      const next = order[(current + step) % order.length];
      setHelpTab(next);
      $(`[data-help-tab="${next}"]`).focus();
    });

    $('#sourcesBody').addEventListener('click', (e) => {
      const addBtn = e.target.closest('[data-add-url]');
      if (addBtn) {
        if (addFromText(addBtn.dataset.addUrl)) $('#sourcesDialog').close();
        return;
      }
      const btn = e.target.closest('[data-url]');
      if (!btn) return;
      const win = window.open(btn.dataset.url, '_blank');
      if (!win) toast('Popup blocked — allow popups for this page.', 'warn');
      else { try { win.opener = null; } catch { /* ignore */ } }
    });

    $$('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => btn.closest('dialog').close());
    });

    $$('dialog.sheet').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
      });
    });

    $('#sourcesBtn').addEventListener('click', () => openSheet($('#sourcesDialog')));
    $('#helpBtn').addEventListener('click', () => openSheet($('#helpDialog')));
    $('#heroSources').addEventListener('click', () => openSheet($('#sourcesDialog')));
  }

  /* ── input & events ────────────────────────────────────────── */

  function focusInput() {
    showChrome();
    const input = $('#urlInput');
    input.focus();
    input.select();
  }

  function autosizeInput() {
    const ta = $('#urlInput');
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
  }

  function submitInput() {
    const input = $('#urlInput');
    const ok = addFromText(input.value);
    if (ok) {
      input.value = '';
      autosizeInput();
      input.focus();
    }
  }

  function swapTiles(aId, bId) {
    if (aId === bId) return;
    const view = activeView();
    const i = view.tiles.findIndex((t) => t.id === aId);
    const j = view.tiles.findIndex((t) => t.id === bId);
    if (i === -1 || j === -1) return;
    [view.tiles[i], view.tiles[j]] = [view.tiles[j], view.tiles[i]];
    save();
    render();
  }

  /* ── hold-and-drag ─────────────────────────────────────────── */

  function beginDrag(e, tileEl) {
    drag = { id: tileEl.dataset.id, node: tileEl, x: e.clientX, y: e.clientY, active: false, target: null };
    window.addEventListener('pointermove', onDragMove, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
  }

  function onDragMove(e) {
    if (!drag) return;
    if (!drag.active) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 5) return;
      drag.active = true;
      drag.node.classList.add('is-dragging');
      document.body.classList.add('is-dragging-tile');
    }
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const over = el && el.closest ? el.closest('.tile') : null;
    const next = over && over !== drag.node ? over : null;
    if (drag.target !== next) {
      if (drag.target) drag.target.classList.remove('is-drop');
      drag.target = next;
      if (next) next.classList.add('is-drop');
    }
  }

  function endDrag() {
    if (!drag) return;
    const { node, target } = drag;
    drag = null;
    node.classList.remove('is-dragging');
    document.body.classList.remove('is-dragging-tile');
    if (target) target.classList.remove('is-drop');
    [...document.querySelectorAll('.is-drop, .is-dragging')].forEach((el) => el.classList.remove('is-drop', 'is-dragging'));
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    if (target && target !== node) swapTiles(node.dataset.id, target.dataset.id);
  }

  function setMoving(on) {
    if (on && !activeView().tiles.length) {
      toast('Add a tile first — arrange mode needs something to move.');
      return;
    }
    document.body.classList.toggle('is-moving', on);
    $('#moveBtn').setAttribute('aria-pressed', String(on));
    $('#moveBar').hidden = !on;
  }

  function wireBoard() {
    const grid = $('#grid');

    /* clicks inside a tile */
    grid.addEventListener('click', (e) => {
      const tileEl = e.target.closest('.tile');
      if (!tileEl) return;
      const id = tileEl.dataset.id;
      if (e.target.closest('.tile-head')) { openSource(findTile(id)); return; }
      const act = e.target.closest('[data-act]');
      if (!act) { lastTileId = id; return; }
      const tile = findTile(id);
      if (!tile) return;
      switch (act.dataset.act) {
        case 'audio': focusAudio(id); break;
        case 'mute': toggleMute(id); break;
        case 'cc':
          tile.cc = !tile.cc;
          state.ccDefault = tile.cc;
          save();
          renderGrid();
          break;
        case 'reload': reloadTile(id); break;
        case 'popout': popout(tile, tileEl); break;
        case 'replace': {
          const view = state.views.find((v) => v.tiles.includes(tile));
          if (view && replaceWithFallback(view, tile)) toast('Swapped in a live feed.');
          else toast('No spare feeds left — paste another link.', 'warn');
          break;
        }
        case 'expand': setFocus(focusedId === id ? null : id); break;
        case 'info': openSource(tile); break;
        case 'fullscreen':
          try {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (tileEl.requestFullscreen) tileEl.requestFullscreen();
          } catch { /* browser refused; nothing else to do */ }
          break;
        case 'close': removeTile(id); break;
        case 'force':
          tile.force = true;
          tile.redirected = false;
          unlearnWindowOnly(tile.host);
          save();
          renderGrid();
          toast(`Keeping ${tile.host} in the tile. Use Reload if it goes blank.`);
          break;
      }
    });

    grid.addEventListener('contextmenu', (e) => {
      const tileEl = e.target.closest('.tile');
      if (!tileEl || e.shiftKey) return; // shift keeps the browser's own menu
      e.preventDefault();
      openSource(findTile(tileEl.dataset.id));
    });

    grid.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const tileEl = e.target.closest('.tile');
      if (!tileEl) return;
      lastTileId = tileEl.dataset.id;
      if (e.target.closest('[data-act]')) return;
      const onGrip = Boolean(e.target.closest('[data-drag]'));
      const moving = document.body.classList.contains('is-moving');
      if (!onGrip && !moving) return;
      e.preventDefault();
      try { e.target.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      beginDrag(e, tileEl);
    });

    /* external link dropped anywhere on the page */
    document.addEventListener('dragover', (e) => {
      const types = [...(e.dataTransfer.types || [])];
      if (!(drag && drag.active) && (types.includes('text/uri-list') || types.includes('text/plain'))) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    });
    document.addEventListener('drop', (e) => {
      if (drag && drag.active) return;
      const data = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (!data) return;
      e.preventDefault();
      if (addFromText(data)) toast('Link added from your drop.');
    });

    /* tab interactions */
    $('#tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      if (e.target.closest('[data-close-view]')) {
        closeView(tab.dataset.view);
        return;
      }
      if (tab.dataset.view !== state.activeId) {
        state.activeId = tab.dataset.view;
        focusedId = null;
        lastTileId = null;
        save();
        render();
      }
    });

    $('#tabs').addEventListener('dblclick', (e) => {
      const label = e.target.closest('.tab-label');
      if (!label) return;
      const tab = label.closest('.tab');
      const view = state.views.find((v) => v.id === tab.dataset.view);
      inlineEdit(label, {
        value: view.name,
        onDone: (next) => {
          view.name = next;
          save();
          renderTabs();
        },
      });
    });

    $('#tabs').addEventListener('keydown', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab || e.target.closest('button')) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        tab.click();
      }
    });

    const layoutTrigger = $('#layoutBtn');
    if (layoutTrigger) layoutTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const wrap = $('.layout-wrap');
      const open = !wrap.classList.contains('is-open');
      wrap.classList.toggle('is-open', open);
      $('#layoutPicker').hidden = !open;
      layoutTrigger.setAttribute('aria-expanded', String(open));
      showChrome();
    });

    $('#layoutPicker').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-layout]');
      if (!btn) return;
      closeLayoutMenu();
      const view = activeView();
      const key = btn.dataset.layout;
      const cap = LAYOUTS[key].cap;
      /* The demo board is a demo: selecting a bigger screen count fills it with live
         channels. Other boards keep their tiles and just show the first N. */
      if ((view.name === 'Demo' || view.preset) && view.tiles.length < cap) {
        const have = new Set(view.tiles.map((t) => t.url));
        const fill = demoLinksFor(9).split(' ').filter((u) => !have.has(u)).slice(0, cap - view.tiles.length);
        if (fill.length) {
          addFromText(fill.join(' '));
          toast(`Filled ${fill.length} more live stream${fill.length === 1 ? '' : 's'} for ${cap}-up.`);
        }
      }
      view.layout = key;
      save();
      render();
      const hidden = view.tiles.length - cap;
      if (hidden > 0) {
        toast(`${hidden} tile${hidden === 1 ? '' : 's'} hidden by ${cap}-up — pick a larger layout to show ${hidden === 1 ? 'it' : 'them'}.`);
      }
    });

    /* more menu */
    const moreBtn = $('#moreBtn');
    const moreMenu = $('#moreMenu');
    const closeMore = () => {
      if (!moreMenu) return;
      moreMenu.hidden = true;
      if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
    };
    if (moreBtn) moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = moreMenu.hidden;
      moreMenu.hidden = !open;
      moreBtn.setAttribute('aria-expanded', String(open));
      showChrome();
    });
    if (moreMenu) moreMenu.addEventListener('click', (e) => {
      if (e.target.closest('.more-item')) {
        closeMore();
        showChrome();
      }
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.more-wrap')) closeMore();
      if (!e.target.closest('.layout-wrap')) closeLayoutMenu();
    });

    window.addEventListener('message', onYtMessage);

    $('#channelsBtn').addEventListener('click', () => toggleChannels());
    $('#menuChannelsBtn').addEventListener('click', () => toggleChannels());
    $('#menuRandomBtn').addEventListener('click', () => openRandomWall());
    $('#menuBlankBtn').addEventListener('click', () => openBlankWall());
    $('#tvModeBtn').addEventListener('click', () => setTvMode(!tvMode));
    $('#menuShareBtn').addEventListener('click', () => openShare());
    const shareThreadsBtn = $('#shareThreadsBtn');
    if (shareThreadsBtn) shareThreadsBtn.addEventListener('click', shareThreads);
    const shareCopyBtn = $('#shareCopyBtn');
    if (shareCopyBtn) shareCopyBtn.addEventListener('click', () => { copyLink(); });
    const shareNativeBtn = $('#shareNativeBtn');
    if (shareNativeBtn) shareNativeBtn.addEventListener('click', shareNative);
    $('#tvHintExit').addEventListener('click', () => setTvMode(false));
    $('#menuArrangeBtn').addEventListener('click', () => setMoving(!document.body.classList.contains('is-moving')));
    $('#channelsClose').addEventListener('click', () => closeChannels());
    $('#channelBackdrop').addEventListener('click', () => closeChannels());
    $('#autoHideBtn').addEventListener('click', toggleAutoHide);
    const fullBtn = $('#fullscreenBtn');
    if (fullBtn) fullBtn.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch { toast('Fullscreen is not available in this browser.', 'warn'); }
    });
    updateAutoHideButton();

    /* show the chrome on any activity; it fades 5s after the last one */
    document.addEventListener('pointermove', () => { if (currentView === 'wall') showChrome(); }, { passive: true });
    document.addEventListener('pointerdown', () => { if (currentView === 'wall') showChrome(); }, { passive: true });
    document.addEventListener('pointerdown', () => { if (!tvMode) stopKeyNav(); }, { passive: true, capture: true });

    /* Downloads must never be a cached older build. Stamp the URL at the last
       moment so every click is a fresh origin request. */
    const stampDownload = (event) => {
      const a = event.target && event.target.closest && event.target.closest('a[href*="multiview-beta.zip"]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href === '#' || href.indexOf('multiview-beta.zip') === -1) return;
      a.href = a.href.split('?')[0] + '?t=' + Date.now().toString(36) +
        Math.random().toString(36).slice(2, 5);
    };
    document.addEventListener('pointerdown', stampDownload, { capture: true, passive: true });
    document.addEventListener('click', stampDownload, true);
    document.addEventListener('wheel', () => { if (currentView === 'wall') showChrome(); }, { passive: true });
    document.addEventListener('keydown', () => { if (currentView === 'wall') showChrome(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) showChrome(); });
    $$('dialog').forEach((d) => d.addEventListener('close', () => showChrome()));

    $('#newViewBtn').addEventListener('click', newView);
    $('#cinemaExitBtn').addEventListener('click', () => setCinema(false));
    const heroDemo = $('#heroDemo');
    if (heroDemo) heroDemo.addEventListener('click', () => loadDemo());
    $('#moveBtn').addEventListener('click', () => setMoving(!document.body.classList.contains('is-moving')));
    $('#moveDoneBtn').addEventListener('click', () => setMoving(false));

    document.addEventListener('mousemove', () => {
      if (!cinema) return;
      document.body.classList.add('cinema-peek');
      clearTimeout(cinemaPeekTimer);
      cinemaPeekTimer = setTimeout(() => {
        if (cinema && !document.querySelector('.cinema-exit:hover')) {
          document.body.classList.remove('cinema-peek');
        }
      }, 2600);
    });

    $('#muteAllBtn').addEventListener('click', toggleMuteAll);
    $('#reloadAllBtn').addEventListener('click', reloadAll);
    $('#popoutAllBtn').addEventListener('click', () => openWallDialog());

    /* paste field */
    const input = $('#urlInput');
    input.addEventListener('input', autosizeInput);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submitInput();
      } else if (e.key === 'Escape') {
        input.blur();
      }
      e.stopPropagation();
    });
    input.addEventListener('paste', (e) => {
      /* clipboardData is null for synthetic paste events (automation, some IMEs) */
      const text = e.clipboardData ? e.clipboardData.getData('text') : '';
      if (!text) return;
      /* Several links in one paste — space, comma or newline separated — go straight in.
         A single link stays in the field so it can be edited first. */
      const links = text.split(/[\s,]+/).filter((t) => normalizeLink(t));
      if (links.length < 2 && !/[\n\r]/.test(text)) return;
      e.preventDefault();
      if (addFromText(text)) {
        input.value = '';
        autosizeInput();
      }
    });
    $('#addBtn').addEventListener('click', submitInput);

    /* global keys */
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      const typing = target.matches && target.matches('input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]');

      if (e.key === 'Escape') {
        if (typing) { target.blur(); return; }
        if (keyNav) { stopKeyNav(); return; }
        if (!$('#moreMenu').hidden) { closeMore(); return; }
        if (!$('#layoutPicker').hidden) { closeLayoutMenu(); return; }
        if (!$('#channelDrawer').hidden) { closeChannels(); return; }
        if (focusedId) { setFocus(null); return; }
        if (tvMode) { setTvMode(false); return; }
        const open = $('dialog[open]');
        if (open) { open.close(); return; }
        if (document.body.classList.contains('is-moving')) { setMoving(false); return; }
        if (cinema) { setCinema(false); return; }
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;
      const tvTarget = target.closest && target.closest('button, a, [role="tab"], [role="button"]');
      const menuOpen = $('#moreMenu') && !$('#moreMenu').hidden;
      const layoutOpen = $('#layoutPicker') && !$('#layoutPicker').hidden;
      const wallNav = currentView === 'wall' && !!activeView().tiles.length &&
        $('#channelDrawer').hidden && !document.querySelector('dialog[open]') &&
        !menuOpen && !layoutOpen && (tvMode || !tvTarget);
      if (wallNav) {
        const navKey = key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' ||
          key === 'ArrowDown' || key === 'Enter' || key === ' ' || /^[1-4]$/.test(key);
        if (!tvMode && navKey) startKeyNav();
        if (tvMode) showTvHint();
        if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
          e.preventDefault();
          moveTvFocus(key);
          return;
        }
        if (key === 'Enter' || key === ' ') {
          const node = tvNodes()[tvIndex];
          if (node) {
            e.preventDefault();
            setFocus(focusedId === node.dataset.id ? null : node.dataset.id);
          }
          return;
        }
        if (/^[1-4]$/.test(key)) {
          e.preventDefault();
          focusTvTile(Number(key) - 1);
          return;
        }
      }
      if (key === 'n' || key === '/') {
        e.preventDefault();
        if (cinema) setCinema(false);
        focusInput();
      } else if (key === 'N') {
        e.preventDefault();
        newView();
      } else if (key === 'm') {
        toggleMuteAll();
      } else if (key === 'r') {
        reloadAll();
      } else if (key === 'f') {
        const id = lastTileId || focusedId;
        if (id) setFocus(focusedId === id ? null : id);
      } else if (key === 'i') {
        const id = lastTileId || focusedId;
        if (id) openSource(findTile(id));
      } else if (key === 't') {
        toggleHeaders();
      } else if (key === 'h') {
        setCinema(!cinema);
      } else if (key === 'v') {
        setMoving(!document.body.classList.contains('is-moving'));
      } else if (key === 'w') {
        e.preventDefault();
        openWallDialog();
      } else if (key === 'c') {
        e.preventDefault();
        if (cinema) setCinema(false);
        toggleChannels();
      } else if (key === 'x') {
        e.preventDefault();
        openRandomWall();
      } else if (key === 'b') {
        e.preventDefault();
        openBlankWall();
      } else if (key === 'y') {
        e.preventDefault();
        setTvMode(!tvMode);
      } else if (key === '?') {
        e.preventDefault();
        openSheet($('#helpDialog'));
      } else if (key === 'k') {
        e.preventDefault();
        openSheet($('#helpDialog'));
      }
    });
  }

  function planReady() {
    return PLAN.stage === 'paid' && !!window.MVSync;
  }

  function updatePlanChip() {
    const label = $('[data-plan="chip"]');
    if (!label) return;
    if (planInfo.mode === 'trial') label.textContent = 'trial · ' + Math.max(0, planInfo.daysLeft) + 'd';
    else if (planInfo.mode === 'locked') label.textContent = 'trial ended';
    else label.textContent = PLAN.stage === 'beta' ? 'beta · free' : 'hosted · $5';
  }

  function refreshPlan() {
    if (!window.MVSync || typeof window.MVSync.account !== 'function' || !window.MVSync.isSignedIn()) {
      updatePlanChip();
      return Promise.resolve(planInfo);
    }
    return window.MVSync.account().then((data) => {
      const days = data && data.user ? data.user.trialDaysLeft : 0;
      planInfo = data && data.entitled
        ? { mode: 'trial', daysLeft: days || 0, entitled: true }
        : { mode: 'locked', daysLeft: 0, entitled: false };
      updatePlanChip();
      renderPlan();
      return planInfo;
    }).catch(() => planInfo);
  }

  function renderPlan() {
    const dialog = $('#planDialog');
    if (!dialog) return;
    const beta = PLAN.stage !== 'paid' && planInfo.mode === 'beta';
    if (planInfo.mode === 'trial') {
      $('[data-plan="status"]', dialog).textContent = 'trial';
      $('[data-plan="headline"]', dialog).textContent = Math.max(0, planInfo.daysLeft) + ' days left in your trial';
      $('[data-plan="copy"]', dialog).textContent = 'everything works until the trial ends. after that, hosted ' +
        'access is ' + PLAN.price + ' ' + PLAN.priceNote + '.';
    } else if (planInfo.mode === 'locked') {
      $('[data-plan="status"]', dialog).textContent = 'trial ended';
      $('[data-plan="headline"]', dialog).textContent = 'hosted access is ' + PLAN.price + ' ' + PLAN.priceNote;
      $('[data-plan="copy"]', dialog).textContent = 'your ' + PLAN.trialDays + '-day trial is over. local boards and the ' +
        'downloaded app keep working. hosted access is ' + PLAN.price + ' ' + PLAN.priceNote + '.';
    } else {
      $('[data-plan="status"]', dialog).textContent = beta ? 'free beta' : 'hosted site';
      $('[data-plan="headline"]', dialog).textContent = beta ? 'free while we\'re in beta.' : 'hosted access is ' + PLAN.price + ' ' + PLAN.priceNote;
      $('[data-plan="copy"]', dialog).textContent = beta
        ? 'the app you download is yours to keep. after beta, hosted access is ' + PLAN.price + ' ' + PLAN.priceNote + '.'
        : 'accounts, cloud boards, sync and share links. the app you download is free.';
    }
    $('[data-plan="price"]', dialog).textContent = PLAN.price + ' ' + PLAN.priceNote;
    const btn = $('[data-plan="upgrade"]', dialog);
    btn.disabled = !planReady();
    btn.textContent = beta ? 'hosted · ' + PLAN.price + ' — coming soon' : (planInfo.mode === 'locked' ? 'get hosted · ' + PLAN.price : 'hosted · ' + PLAN.price + ' ' + PLAN.priceNote);
    btn.title = planReady() ? 'Open checkout' : 'Billing is not switched on yet';
    $('[data-plan="note"]', dialog).textContent = beta
      ? 'your downloaded app is yours. hosted access is the paid part.'
      : 'hosted access needs the optional sync backend and stripe keys.';
  }

  function renderWallDialog() {
    const dialog = $('#wallDialog');
    if (!dialog) return;
    const view = activeView();
    const st = wallStatus();
    $('[data-wall="meta"]', dialog).textContent = view.name + ' · ' + view.tiles.length +
      ' tile' + (view.tiles.length === 1 ? '' : 's') + ' · ' + st.open + ' window' + (st.open === 1 ? '' : 's') + ' open';
    $$('[data-wall-preset]', dialog).forEach((b) => {
      b.setAttribute('aria-pressed', String((view.wallPreset || 'auto') === b.dataset.wallPreset));
    });
    $('[data-wall="open"]', dialog).disabled = !view.tiles.length;
    $('[data-wall="close"]', dialog).disabled = st.open === 0;
  }

  function openWallDialog() {
    renderWallDialog();
    openSheet($('#wallDialog'));
  }

  /* ── source inspector ──────────────────────────────────────── */

  let sourceTileId = null;
  let sourceTab = 'source';
  let sourceMeta = null;
  const metaCache = new Map();

  function applyShowHeaders() {
    document.body.classList.toggle('show-headers', !!state.showHeaders);
  }

  function toggleHeaders(force) {
    state.showHeaders = typeof force === 'boolean' ? force : !state.showHeaders;
    save();
    applyShowHeaders();
    renderGrid();
  }

  function markSelected() {
    $$('.tile').forEach((node) => {
      node.classList.toggle('is-selected', node.dataset.id === sourceTileId);
    });
  }

  function openSource(tile) {
    if (!tile) return;
    sourceTileId = tile.id;
    lastTileId = tile.id;
    sourceTab = 'source';
    sourceMeta = null;
    renderSource();
    markSelected();
    openSheet($('#sourceDialog'));
  }

  function infoRow(label, value) {
    return `<div class="info-row"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
  }

  function oembedUrl(tile) {
    if (!tile) return null;
    if (tile.kind === 'youtube') {
      return 'https://www.youtube.com/oembed?url=' + encodeURIComponent(tile.url) + '&format=json';
    }
    if (tile.kind === 'vimeo') {
      return 'https://vimeo.com/api/oembed.json?url=' + encodeURIComponent(tile.url);
    }
    if (tile.kind === 'dailymotion') {
      return 'https://www.dailymotion.com/services/oembed?url=' + encodeURIComponent(tile.url) + '&format=json';
    }
    return null;
  }

  function renderMeta(data) {
    const dialog = $('#sourceDialog');
    const box = dialog && $('[data-meta]', dialog);
    if (!box || !data) return;
    sourceMeta = data;
    const thumb = data.thumbnail_url
      ? `<img class="meta-thumb" src="${esc(data.thumbnail_url)}" alt="" referrerpolicy="no-referrer" loading="lazy">`
      : '';
    box.innerHTML =
      `<div class="meta-card">${thumb}<div class="meta-copy">` +
        `<b>${esc(data.title || 'Untitled')}</b>` +
        `<span>${esc(data.author_name || '')}${data.provider_name ? ' · ' + esc(data.provider_name) : ''}</span>` +
      `</div></div>` +
      `<button class="btn ghost" data-src-act="use-title">Use as tile name</button>`;
  }

  async function loadTileMeta(tile) {
    const dialog = $('#sourceDialog');
    const box = dialog && $('[data-meta]', dialog);
    if (!box || !tile) return;
    const url = oembedUrl(tile);
    if (!url) {
      box.innerHTML = '<p class="meta-note">Title lookup is available for YouTube, Vimeo and Dailymotion links.</p>';
      return;
    }
    sourceMeta = null;
    if (metaCache.has(tile.url)) {
      renderMeta(metaCache.get(tile.url));
      return;
    }
    box.innerHTML = '<p class="meta-note">Reading the title…</p>';
    try {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !data.title) throw new Error('No title');
      metaCache.set(tile.url, data);
      if (dialog.open && sourceTileId === tile.id && sourceTab === 'source') renderMeta(data);
    } catch {
      if (dialog.open && sourceTileId === tile.id && sourceTab === 'source') {
        box.innerHTML = '<p class="meta-note">Couldn\'t read this title. Channel /live links don\'t expose one without YouTube\'s API; a specific video link does.</p>';
      }
    }
  }

  function renderSource() {
    const dialog = $('#sourceDialog');
    const tile = findTile(sourceTileId);
    if (!dialog || !tile) return;

    $('[data-source="sub"]', dialog).textContent =
      (tile.host || 'source') + ' · ' + (KIND_LABEL[tile.kind] || 'web page');
    const blockedForState = tile.kind === 'blocked' && !tile.force;
    const redirectedForState = !!tile.redirected && !tile.force;
    const stateEl = $('[data-source="state"]', dialog);
    if (stateEl) {
      const windowed = blockedForState || redirectedForState;
      stateEl.textContent = windowed ? 'Window only' : 'Embedded';
      stateEl.className = 'source-state ' + (windowed ? 'is-window' : 'is-inline');
    }
    $$('[data-source-tab]', dialog).forEach((btn) => {
      const on = btn.dataset.sourceTab === sourceTab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
    });

    const body = $('#sourceBody', dialog);
    const blocked = tile.kind === 'blocked' && !tile.force;
    const redirected = !!tile.redirected && !tile.force;

    if (sourceTab === 'source') {
      const framing = blocked ? 'Blocked — opens in a window'
        : redirected ? 'Redirected — window only'
        : 'Embedded in this tile';
      body.innerHTML =
        infoRow('Type', KIND_LABEL[tile.kind] || 'Web page') +
        infoRow('Host', tile.host || '—') +
        infoRow('Framing', framing) +
        infoRow('Audio', tile.muted ? 'Muted' : 'On') +
        infoRow('Captions', tile.kind === 'youtube' ? (tile.cc ? 'On' : 'Off') : 'Not provided in the tile') +
        infoRow('Board', activeView().name) +
        `<div class="source-meta" data-meta></div>` +
        `<div class="info-url"><span>Source URL</span><code>${esc(tile.url)}</code></div>` +
        (tile.embed && tile.embed !== tile.url
          ? `<div class="info-url"><span>Player URL</span><code>${esc(tile.embed)}</code></div>` : '') +
        `<div class="info-actions">
          <button class="btn" data-src-act="copy">Copy link</button>
          <button class="btn" data-src-act="open">Open source</button>
          <button class="btn" data-src-act="window">Open in window</button>
          <button class="btn ghost" data-src-act="reload">Reload tile</button>
        </div>
        <p class="info-copy">Right-click a tile — or press <kbd>I</kbd> — to reopen this panel.</p>`;
      loadTileMeta(tile);
    } else if (sourceTab === 'headers') {
      body.innerHTML =
        `<p class="info-copy">Response headers are not exposed to this page for cross-origin
          frames. What multiview controls is listed below; the site decides everything else.</p>` +
        infoRow('Referrer policy', 'no-referrer-when-downgrade') +
        infoRow('Sandbox', 'scripts, same-origin, forms, pointer-lock, presentation, orientation-lock') +
        infoRow('Allow', 'autoplay, fullscreen, encrypted-media, picture-in-picture, clipboard-write, screen-wake-lock') +
        infoRow('Frame policy', 'set by the site (X-Frame-Options / CSP); a refusal shows as a card') +
        `<div class="info-actions">
          <button class="btn" data-src-act="headers">Check headers</button>
          <span class="info-hint">Works only where the URL allows CORS — media servers often do.</span>
        </div>
        <pre class="info-pre" data-headers>Not checked yet.</pre>`;
    } else {
      body.innerHTML =
        `<label class="info-toggle">
          <input type="checkbox" data-src-act="toggle-headers" ${state.showHeaders ? 'checked' : ''}>
          <span>Show tile headers</span>
        </label>
        <p class="info-copy">Off by default. Adds a slim bar with the source name, host and type to
          every tile. Press <kbd>T</kbd> any time to switch it.</p>
        <p class="info-copy">Right-clicking a tile, or pressing <kbd>I</kbd>, opens this panel.</p>`;
    }
  }

  async function checkHeaders(tile) {
    const dialog = $('#sourceDialog');
    const pre = dialog && $('[data-headers]', dialog);
    if (!pre || !tile) return;
    pre.textContent = 'Checking…';
    const url = tile.media && tile.media.url ? tile.media.url : tile.url;
    let sameOrigin = false;
    try { sameOrigin = new URL(url, location.href).origin === location.origin; } catch { /* ignore */ }
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 8000) : 0;
    try {
      if (!sameOrigin) {
        /* A no-cors probe checks reachability without triggering a CORS console error.
           The response is opaque: browsers deliberately hide its headers. */
        await fetch(url, {
          method: 'HEAD',
          mode: 'no-cors',
          credentials: 'omit',
          redirect: 'follow',
          signal: controller ? controller.signal : undefined,
        });
        pre.textContent = 'Reachable.\n\nHeaders are hidden by the browser for cross-origin sources' +
          ' — an opaque response exposes no status or headers.\n' +
          'Only same-origin URLs can be read. Open the source in a window and use its network panel.';
      } else {
        const res = await fetch(url, {
          method: 'HEAD',
          mode: 'cors',
          credentials: 'omit',
          redirect: 'follow',
          signal: controller ? controller.signal : undefined,
        });
        const lines = [`HTTP ${res.status} ${res.statusText || ''}`.trim()];
        res.headers.forEach((value, key) => lines.push(`${key}: ${value}`));
        if (lines.length === 1) lines.push('(no response headers exposed)');
        pre.textContent = lines.join('\n');
      }
    } catch (error) {
      pre.textContent = 'Could not check this URL.\n' +
        (error && error.message ? error.message + '\n' : '') +
        '\nCross-origin headers stay hidden even when the request succeeds.';
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function openPlan() {
    renderPlan();
    openSheet($('#planDialog'));
  }

  function migrateDemoBoard() {
    let changed = false;
    state.views
      .filter((v) => v.name === 'Demo')
      .forEach((view) => {
        view.tiles.forEach((tile) => {
          const id = Object.keys(DEMO_NAMES).find((key) => String(tile.url).includes(key));
          if (id && tile.name !== DEMO_NAMES[id]) {
            tile.name = DEMO_NAMES[id];
            changed = true;
          }
        });
        view.tiles = view.tiles.map((tile) => {
          const oldId = Object.keys(RETIRED_DEMO).find((id) => String(tile.url).includes(id));
          if (!oldId) return tile;
          const fresh = parseLink(RETIRED_DEMO[oldId]);
          if (!fresh) return tile;
          fresh.id = tile.id;              /* keep the node / position */
          fresh.muted = tile.muted;
          fresh.cc = tile.cc;
          const key = (RETIRED_DEMO[oldId].match(/channel\/([^/]+)/) ||
            RETIRED_DEMO[oldId].match(/[?&]v=([A-Za-z0-9_-]{11})/) || [])[1];
          fresh.name = DEMO_NAMES[key] || fresh.name;
          changed = true;
          return fresh;
        });
      });
    const before = state.history.length;
    state.history = state.history.filter((h) =>
      !Object.keys(RETIRED_DEMO).some((id) => String(h.url).includes(id)));
    return changed || state.history.length !== before;
  }

  function nameDemoTiles() {
    const label = (url) => {
      const key = Object.keys(DEMO_NAMES).find((id) => String(url).indexOf(id) !== -1);
      return key ? DEMO_NAMES[key] : '';
    };
    activeView().tiles.forEach((t) => {
      const name = label(t.url);
      if (name) t.name = name;
    });
    (state.history || []).forEach((h) => {
      const name = label(h.url);
      if (name) h.title = name;
    });
  }

  /**
   * Rebuild the Demo board with exactly `count` live channels and the matching layout.
   * Only the Demo board is touched; every other board is left alone.
   */
  /* Sports shown as preview cards on the home page. `url` is the feed that goes
     first on the wall; the rest of the sports wall fills in after it. */
  const SPORTS = [
    { key: 'basketball', name: 'Basketball', league: 'NBA', url: 'https://www.youtube.com/watch?v=y-jR93AytPc', thumb: 'y-jR93AytPc' },
    { key: 'baseball', name: 'Baseball', league: 'MLB', url: 'https://www.youtube.com/watch?v=QkGOollG-S4', thumb: 'QkGOollG-S4' },
    { key: 'soccer', name: 'Soccer', league: 'Premier League', url: 'https://www.youtube.com/watch?v=p4aNGqai4ec', thumb: 'p4aNGqai4ec' },
    { key: 'olympics', name: 'Olympics', league: 'Olympic Games', url: 'https://www.youtube.com/watch?v=ie920kzulsc', thumb: 'ie920kzulsc' },
    { key: 'mma', name: 'MMA', league: 'UFC on Paramount+', url: 'https://www.youtube.com/watch?v=IIy0uIqFjb0', thumb: 'IIy0uIqFjb0' },
    { key: 'cfb', name: 'College football', league: 'ESPN College Football', url: 'https://www.youtube.com/watch?v=MRO9RbJuZLg', thumb: 'MRO9RbJuZLg' },
    { key: 'esports', name: 'Esports', league: 'ESL Counter-Strike', url: 'https://www.youtube.com/watch?v=Se6OL_DsGo8', thumb: 'Se6OL_DsGo8' },
  ];

  /* Services that check your own subscription instead of allowing frames.
     We never see or store the login — the site opens and asks for it itself. */
  const SIGNIN_SITES = [
    { name: 'FOX Sports', url: 'https://www.foxsports.com/live' },
    { name: 'FS1', url: 'https://www.fox.com/live' },
    { name: 'ESPN', url: 'https://www.espn.com/watch/' },
    { name: 'ESPN+', url: 'https://plus.espn.com/' },
    { name: 'NBA League Pass', url: 'https://www.nba.com/watch/league-pass-stream' },
    { name: 'MLB.TV', url: 'https://www.mlb.com/tv' },
    { name: 'NFL+', url: 'https://www.nfl.com/plus/' },
    { name: 'UFC Fight Pass', url: 'https://ufcfightpass.com/' },
    { name: 'DAZN', url: 'https://www.dazn.com/' },
    { name: 'F1 TV', url: 'https://f1tv.formula1.com/' },
    { name: 'Peacock', url: 'https://www.peacocktv.com/' },
    { name: 'Paramount+', url: 'https://www.paramountplus.com/live-tv/' },
    { name: 'Sling', url: 'https://watch.sling.com/' },
    { name: 'Willow TV', url: 'https://www.willow.tv/' },
  ];

  function openSport(key) {
    const sport = SPORTS.find((s) => s.key === key);
    if (!sport) return false;
    const preset = PRESETS.find((p) => p.key === 'sports');
    let view = state.views.find((v) => v.preset === 'sports');
    if (!view) {
      view = makeView('Sports');
      view.preset = 'sports';
      state.views.push(view);
    }
    state.activeId = view.id;
    focusedId = null;
    view.tiles = [];
    view.audioFocus = null;
    view.layout = '4';
    const ordered = [sport.url, ...preset.links.filter((u) => u !== sport.url)].slice(0, 4);
    addFromText(ordered.join(' '));
    nameDemoTiles();
    save();
    render();
    showView('wall');
    toast(`${sport.name} first — ${view.tiles.length} sports feeds.`);
    return true;
  }

  function openSignIn(url, name) {
    const win = window.open(url, 'mv_signin_' + String(name || 'site').replace(/\W+/g, ''),
      'popup=yes,width=1180,height=780');
    if (!win) {
      toast('Pop-up blocked — allow pop-ups for this page, then try again.', 'warn');
      return false;
    }
    try { win.opener = null; } catch (e) { /* ignore */ }
    toast(`${name || 'Site'} — sign in with your own account. We never see it.`);
    return true;
  }

  function setupDemo(count) {
    const wanted = [1, 2, 4].includes(Number(count)) ? Number(count) : 4;
    let demo = state.views.find((v) => v.name === 'Demo');
    if (!demo) {
      demo = makeView('Demo');
      state.views.push(demo);
    }
    state.activeId = demo.id;
    focusedId = null;
    demo.tiles = [];
    demo.audioFocus = null;
    demo.layout = String(wanted);
    addFromText(demoLinksFor(wanted));
    nameDemoTiles();
    save();
    render();
    showView('wall');
    return demo.tiles.length === wanted;
  }

  function loadDemo() {
    return setupDemo(4);
  }

  function openPreset(key) {
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) return false;
    let view = state.views.find((v) => v.preset === key);
    if (!view) {
      view = makeView(preset.name);
      view.preset = key;
      state.views.push(view);
    }
    state.activeId = view.id;
    focusedId = null;
    view.tiles = [];
    view.audioFocus = null;
    view.layout = LAYOUTS[preset.layout] ? preset.layout : '4';
    var pool = preset.random ? shuffled(preset.links) : preset.links;
    var chosen = preset.pick ? pool.slice(0, preset.pick) : pool;
    addFromText(chosen.join(' '));
    nameDemoTiles();
    save();
    render();
    showView('wall');
    toast(preset.name + ' — ' + view.tiles.length + ' streams.');
    return true;
  }

  function openRandomWall(count) {
    const wanted = [2, 4].includes(Number(count)) ? Number(count) : 4;
    let picks = [];
    if (window.MVDash && typeof window.MVDash.randomPicks === 'function') {
      picks = window.MVDash.randomPicks(wanted);
    }
    if (!picks.length) {
      picks = demoLinksFor(wanted).split(' ').map((url) => ({ url, name: '' }));
    }
    let view = state.views.find((v) => v.name === 'Random');
    if (!view) {
      view = makeView('Random');
      state.views.push(view);
    }
    state.activeId = view.id;
    focusedId = null;
    lastTileId = null;
    view.tiles = [];
    view.audioFocus = null;
    view.layout = String(wanted);
    addFromText(picks.map((p) => p.url).join(' '));
    view.tiles.forEach((tile) => {
      const pick = picks.find((p) => p.url === tile.url);
      if (pick && pick.name) tile.name = pick.name;
    });
    save();
    render();
    showView('wall');
    toast(`Random multiview — ${view.tiles.length} streams.`);
    return view.tiles.length === wanted;
  }

  function openBlankWall() {
    let n = 1;
    let name = 'Blank';
    while (state.views.some((v) => v.name === name)) {
      n++;
      name = 'Blank ' + n;
    }
    const view = makeView(name);
    state.views.push(view);
    state.activeId = view.id;
    focusedId = null;
    lastTileId = null;
    save();
    render();
    showView('wall');
    setTimeout(focusInput, 80);
    toast('Blank multiview — paste a link to start.');
    return view.id;
  }

  function newView(name) {
    const view = makeView(uniqueBoardName(name || `Board ${state.views.length + 1}`));
    state.views.push(view);
    state.activeId = view.id;
    focusedId = null;
    save();
    render();
    showView('wall');
    setTimeout(focusInput, 30);
    return view;
  }

  function closeView(id) {
    if (state.views.length === 1) {
      const view = state.views[0];
      if (!view.tiles.length) { toast('This is the last view.'); return; }
      if (!confirm('Clear this view and remove its tiles?')) return;
      view.tiles = [];
      view.layout = '4';
      [...tileNodes.keys()].forEach((k) => tileNodes.delete(k));
      save();
      render();
      return;
    }
    const i = state.views.findIndex((v) => v.id === id);
    if (i === -1) return;
    const closed = state.views[i];
    closed.tiles.forEach((t) => tileNodes.delete(t.id));
    state.views.splice(i, 1);
    if (state.activeId === id) {
      state.activeId = state.views[Math.max(0, i - 1)].id;
      focusedId = null;
      lastTileId = null;
    }
    save();
    render();
  }

  /* ── boot ──────────────────────────────────────────────────── */

  function boot() {
    state = loadState();
    if (!state.access || !state.access.id) { state.access = newAccess(); save(); }
    if (migrateDemoBoard()) save();
    applyShowHeaders();
    if (!state.views.some((v) => v.id === state.activeId)) state.activeId = state.views[0].id;

    wireDialogs();
    wireBoard();
    wireBoardSharing();
    render();
    autosizeInput();

    /* a shared board link: #b=… — always review before it is applied */
    const hashMatch = location.hash.match(/^#b=(.+)$/);
    if (hashMatch) {
      let prefill = '';
      try { prefill = b64decode(decodeURIComponent(hashMatch[1])); } catch { /* ignore */ }
      try { history.replaceState(null, '', location.pathname + location.search); } catch { /* ignore */ }
      if (prefill) {
        setTimeout(() => {
          openBoardDialog(prefill);
          toast('Board link loaded — check the preview, then press Import.');
        }, 500);
      }
    }

    /* The downloadable build marks itself: the bundle cannot contain its own zip. */
    if (document.querySelector('meta[name="mv-edition"][content="download"]')) {
      document.body.classList.add('is-download');
      $$('a[download]').forEach((a) => {
        a.removeAttribute('download');
        a.setAttribute('href', '#');
        a.title = 'You are running the downloaded build';
        [...a.childNodes].forEach((n) => {
          if (n.nodeType === 3 && /Download/.test(n.textContent)) {
            n.textContent = n.textContent.replace(/Download( build)?/, 'Running offline');
          }
        });
        const hint = a.querySelector('.more-hint');
        if (hint) hint.remove();
        a.addEventListener('click', (e) => {
          e.preventDefault();
          toast('You are already running the downloaded build — this is it.');
        });
      });
    }

    if (location.protocol === 'file:') {
      setTimeout(() => toast('Twitch needs a localhost origin — run start.command rather than opening the file directly.', 'warn'), 900);
    }

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline shell is optional */ });
    }

    /* keep tile iframes from eating scroll on the empty hero */
    window.addEventListener('resize', () => {
      const hero = $('#hero');
      if (!hero.hidden) hero.scrollTop = 0;
    });

    /* Debug seam for the regression harness. Local state only, no network. */
    window.__mv = {
      version: 2,
      state: () => JSON.parse(JSON.stringify(state)),
      exportBoard: () => exportBoard(activeView()),
      parseBoardText,
      applyImport,
      addMedia,
      showView,
      wall: { open: openWindowWall, close: closeWindowWall, status: wallStatus },
      windowOnly: (url) => windowOnly(hostOf(url)),
      learnWindowOnly,
    };

    /* Public API used by the dashboard module. */
    window.MV = {
      version: 2,
      getState: () => state,
      showView,
      toast,
      addUrls: (text) => {
        const ok = addFromText(text);
        if (ok) showView('wall');
        return ok;
      },
      addMedia,
      boards: () => state.views.map((v) => ({
        id: v.id,
        name: v.name,
        layout: v.layout,
        tiles: v.tiles.length,
        active: v.id === state.activeId,
      })),
      openBoard: (id) => {
        if (!state.views.some((v) => v.id === id)) return;
        state.activeId = id;
        focusedId = null;
        save();
        render();
        showView('wall');
      },
      newBoard: (name) => newView(name),
      loadDemo,
      demo: (count) => setupDemo(count),
      randomWall: (count) => openRandomWall(count),
      blankWall: () => openBlankWall(),
      tvMode: (on) => setTvMode(on !== false),
      isTvMode: () => tvMode,
      share: openShare,
      copyLink: copyLink,
      preset: (key) => openPreset(key),
      presets: () => PRESETS.map((p) => ({ key: p.key, name: p.name, layout: p.layout, blurb: p.blurb, thumbs: p.thumbs || [], links: p.links || [], rights: p.rights || '' })),
      sport: (key) => openSport(key),
      isDownloadEdition: () => document.body.classList.contains('is-download'),
      toast: (message, type) => toast(message, type),
      sports: () => SPORTS.map((p) => ({ key: p.key, name: p.name, league: p.league, url: p.url, thumb: p.thumb })),
      signInSites: () => SIGNIN_SITES.map((p) => ({ name: p.name, url: p.url })),
      openSignIn,
      isLoginUrl: (url) => isLoginHost(hostOf(url)),
      removeBoard: (id) => closeView(id),
      history: () => (state.history || []).slice(),
      sources: () => state.sources,
      access: () => ({ ...state.access }),
      closeChannels,
      setSources: (next) => { state.sources = next; save(); },
      recordHistory: pushHistory,
      updateLastHistoryTitle: (url, title) => {
        const hit = (state.history || []).find((h) => h.url === url);
        if (hit && title) { hit.title = title.slice(0, 120); save(); }
      },
      save,
      render,
    };

    $$('#viewNav [data-view]').forEach((btn) => {
      btn.addEventListener('click', () => showView(btn.dataset.view));
    });

    document.addEventListener('click', (e) => {
      const preset = e.target.closest('[data-wall-preset]');
      if (preset) {
        activeView().wallPreset = preset.dataset.wallPreset;
        save();
        renderWallDialog();
        return;
      }
      const openBtn = e.target.closest('[data-wall="open"]');
      if (openBtn) {
        const r = openWindowWall(activeView().wallPreset || 'auto');
        if (r.opened === r.total) {
          toast('Opened ' + r.opened + ' window' + (r.opened === 1 ? '' : 's') + ' in a ' + r.cols + '×' + r.rows + ' grid.');
        } else {
          toast('Opened ' + r.opened + ' of ' + r.total + ' — allow pop-ups for ' + location.host + ' and try again.', 'warn');
        }
        renderWallDialog();
        return;
      }
      const closeBtn = e.target.closest('[data-wall="close"]');
      if (closeBtn) {
        const closed = closeWindowWall();
        toast(closed ? 'Closed ' + closed + ' window' + (closed === 1 ? '' : 's') + '.' : 'No windows left to close.');
        renderWallDialog();
        return;
      }
      const trigger = e.target.closest('[data-act="plan"]');
      if (trigger) {
        e.preventDefault();
        openPlan();
        return;
      }
      const upgrade = e.target.closest('[data-plan="upgrade"]');
      if (upgrade) {
        if (!planReady()) return;
        if (!window.MVSync.isSignedIn()) {
          toast('Sign in first — accounts are not wired into this build yet.', 'warn');
          return;
        }
        window.MVSync.checkout()
          .then((data) => { if (data && data.url) location.href = data.url; })
          .catch((err) => toast(err.message || 'Checkout is unavailable.', 'warn'));
      }
    });

    if (window.MVDash && typeof window.MVDash.init === 'function') {
      window.MVDash.init(window.MV);
    }

    state.views.forEach((v) => v.tiles.forEach((t) => {
      if (t.kind === 'generic' && windowOnly(t.host) && !t.force) {
        t.redirected = true;
        t.reason = 'window-only';
      }
    }));

    if (freshInstall) {
      addFromText(DEMO_LINKS);
      nameDemoTiles();
      save();
      render();
    }

    /* Always land on Home: the demo wall is one click away, and new visitors
       get the overview rather than an inherited board. */
    showView('home');
    refreshPlan();

    const bootParams = new URLSearchParams(location.search);
    const tvParam = bootParams.get('tv');
    const bootPreset = bootParams.get('preset');
    /* A TV browser should land on the wall, not the marketing page. Phones,
       tablets and desktops keep Home. ?home is the escape hatch. */
    const tvAgent = /(smart-?tv|googletv|google tv|android tv|firetv|fire tv|bravia|aft[mbds]|crkey|chromecast|hbbtv|netcast|web0s|webos|tizen|viera|opera tv|appletv|apple tv|dtv)/i.test(navigator.userAgent);
    let tvPointer = false;
    try {
      /* Unknown TV browsers still identify as a big, hover-free, touch-free screen.
         Tablets are excluded by maxTouchPoints, phones by the width test. */
      tvPointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches &&
        navigator.maxTouchPoints <= 1;
    } catch { /* matchMedia unavailable */ }
    const tvScreen = (tvAgent || tvPointer) && window.innerWidth >= 700 &&
      !/iphone|ipad|android.*mobile/i.test(navigator.userAgent);
    const startTv = tvParam === '1' || isTvUrl() || location.hash === '#tv' || (tvScreen && !bootParams.has('home'));
    if (startTv) {
      setTimeout(() => setTvMode(true), 30);
    }
    cleanBootUrl(startTv);
    if (bootPreset && PRESETS.some((p) => p.key === bootPreset)) {
      setTimeout(() => openPreset(bootPreset), 80);
    }
  }

  /* Privacy-light error reporting. Only on HTTPS, max five per page, no user
     data and no query strings. The Pages Function logs it for `wrangler tail`. */
  let errorBudget = 0;
  let errorLast = 0;
  function reportClientError(kind, message, stack) {
    if (location.protocol !== 'https:') return;
    if (message === 'Script error.') return;
    const now = Date.now();
    if (now - errorLast < 5000 || errorBudget >= 5) return;
    errorLast = now;
    errorBudget += 1;
    const build = document.querySelector('meta[name="mv-build"]');
    const payload = {
      kind: String(kind || 'error').slice(0, 20),
      message: String(message || '').slice(0, 500),
      stack: String(stack || '').slice(0, 2000),
      path: location.pathname.slice(0, 200),
      build: build ? build.getAttribute('content') : '',
    };
    try {
      navigator.sendBeacon('/api/error', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    } catch { /* ignore */ }
  }
  window.addEventListener('error', (event) => reportClientError('error', event.message, event.error && event.error.stack));
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    reportClientError('rejection', reason && reason.message ? reason.message : reason, reason && reason.stack);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
