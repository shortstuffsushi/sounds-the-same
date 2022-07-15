const axios = require('axios');
const _ = require('lodash');

const verbosePrint = true;
const limitPrint = 30;
const stationKey = 'wlum';
const trackTops = false;

(async () => {
    const knownBadSongs = [
        'a ok',
        'all my favorite songs',
        'are you bored yet?',
        'bad guy',
        'bang',
        'brass monkey',
        'brightside',
        'can you handle my love?',
        'chaise longue',
        'chapstick',
        'cringe',
        'colorado',
        'colors',
        'dissolve',
        'enemy',
        'everything i wanted',
        'fire for you',
        'follow you',
        'gone daddy gone',
        'heat wave',
        'high hopes',
        'honeybee',
        'i dont wanna talk (i just wanna dance)',
        'i hope ur miserable until ur dead',
        'ill call you mine',
        'kyoto',
        'level of concern',
        'let me down',
        'life goes on',
        'lost in yesterday',
        'missing piece',
        'monday',
        'my exs best friend',
        'my universe',
        'no bad days',
        'no love in la',
        'record player',
        'saturday',
        'sex and candy',
        'skin and bones',
        'shy away',
        'smile',
        'survivor',
        'taking me back',
        'talking to ourselves',
        'time in disguise',
        'hardest cut',
        'outside',
        'sun hasnt left',
        'sureshot',
        'therefore i am',
        'trampoline',
        'toxic',
        'waiting on a war',
        'wake me up',
        'what you say',
        'wrecked',
        'way less sad'
    ];

    const artistAdjustmentMap = {
        'bastille x marshmello': 'bastille',
        'death cab for cutie/postal service': 'death cab for cutie',
        'gorillaz/blur': 'gorillaz',
        'jack white': 'white stripes',
        'twenty one pilots': '21 pilots',
    }

    const oldTopFive = ['nirvana', 'foo fighters', 'pearl jam', 'green day', 'red hot chili peppers'];
    const oldTopTen = [...oldTopFive, 'smashing pumpkins', 'weezer', 'sublime', 'coldplay'];

    const currentTopFive = ['imagine dragons', 'lumineers', 'ajr', 'twenty one pilots', 'black keys'];
    const currentTopTen = [...currentTopFive, 'killers', 'billie eilish', 'glass animals', 'mumford and sons', 'boywithuke'];

    let oldTopFiveCount = 0;
    let oldTopTenCount = 0;
    let currentTopFiveCount = 0;
    let currentTopTenCount = 0;

    const artistMap = {};

    let currentDate = new Date().toISOString()

    while (currentDate) {
        console.log(`starting ${currentDate}`);
        const url = `https://api.ldrhub.com/?key=${stationKey}&method=now_playing_range&start_date=2020-01-01&end_date=${currentDate}&limit=500`; // the api only returns about 100 days back, so the 2020 date is meaningless
        const { data } = await axios.get(url);

        const lastTimestamp = data.now_playing_range[data.now_playing_range.length - 1].timestamp;
        const lastDate = lastTimestamp.substring(0, lastTimestamp.length - 3);
        if (lastDate === currentDate || !data.now_playing_range.length) {
            break;
        }

        currentDate = lastDate;

        for (const song of data.now_playing_range) {
            const reportedArtist = song.artist.toLowerCase().replace(/[+&]/g, 'and').replace(/-/g, ' ').replace(/['`\.]/g, '').replace(/^the /, '');
            const reportedTitle = song.title.toLowerCase().replace(/[+&]/g, 'and').replace(/-/g, '').replace(/['`\.]/g, '').replace(/^the /, '');

            let actualArtist = reportedArtist;
            let actualTitle = reportedTitle;

            // sometimes the data comes back flipped from the api
            if (knownBadSongs.includes(reportedArtist)) {
                actualArtist = reportedTitle;
                actualTitle = reportedArtist;
            }

            // normalize some artist names
            if (artistAdjustmentMap[actualArtist]) {
                actualArtist = artistAdjustmentMap[actualArtist];
            }

            if (!artistMap[actualArtist]) {
                artistMap[actualArtist] = { artist: actualArtist, count: 0, songs: {} };
            }

            artistMap[actualArtist].count += 1;

            if (!artistMap[actualArtist].songs[actualTitle]) {
                artistMap[actualArtist].songs[actualTitle] = 0;
            }

            artistMap[actualArtist].songs[actualTitle] += 1;

            if (trackTops) {
                if (oldTopTen.includes(actualArtist)) {
                    oldTopTenCount++;

                    if (oldTopFive.includes(actualArtist)) {
                        oldTopFiveCount++;
                    }
                }

                if (currentTopTen.includes(actualArtist)) {
                    currentTopTenCount++;

                    if (currentTopFive.includes(actualArtist)) {
                        currentTopFiveCount++;
                    }
                }
            }
        }
    }

    console.log('\n\n\n\n\n\n\n');

    const orderedArtists = _.orderBy(artistMap, 'count', 'desc');
    const limitedArtists = limitPrint ? _.take(orderedArtists, limitPrint) : orderedArtists;
    for (const [index, artistObject] of limitedArtists.entries()) {
        console.log(`${(index + 1).toString().padStart(3)}: ${artistObject.artist} - ${artistObject.count}`);

        if (verbosePrint) {
            for (const [song, count] of Object.entries(artistObject.songs)) {
                if (song === 'artist' || song === 'count') { continue; }

                console.log(`       * ${song} - ${count}`);
            }
        }
    }

    if (trackTops) {
        console.log(`The old top five (${oldTopFive.join(', ')}) were played ${oldTopFiveCount} times`);
        console.log(`The old top ten (${oldTopTen.join(', ')}) were played ${oldTopTenCount} times`);
        console.log(`The current top five (${currentTopFive.join(', ')}) were played ${currentTopFiveCount} times`);
        console.log(`The current top ten (${currentTopTen.join(', ')}) were played ${currentTopTenCount} times`);
    }
})();