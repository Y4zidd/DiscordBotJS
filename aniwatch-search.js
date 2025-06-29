// src/commands/aniwatch-search.js
const { HiAnime } = require("aniwatch");
const readline = require("readline");

const hianime = new HiAnime.Scraper();

async function searchAnime(query) {
    try {
        const data = await hianime.search(query, 1); // page 1, tanpa filter tambahan
        let allAnimes = [];
        let currentPage = 1;
        let keepPaging = true;
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        while (keepPaging) {
            const pageData = currentPage === 1 ? data : await hianime.search(query, currentPage);
            if (!pageData.animes || pageData.animes.length === 0) {
                if (currentPage === 1) {
                    console.log("Tidak ada hasil ditemukan.");
                    rl.close();
                    return;
                } else {
                    break;
                }
            }
            allAnimes = allAnimes.concat(pageData.animes);
            console.log(`\nHasil pencarian halaman ${currentPage} untuk \"${query}\":`);
            pageData.animes.forEach((anime, idx) => {
                const link = anime.url || `https://hianime.to/watch/${anime.id}`;
                console.log(`${allAnimes.length - pageData.animes.length + idx + 1}. ${anime.name}`);
            });
            if (pageData.hasNextPage && currentPage < pageData.totalPages) {
                const answer = await new Promise(res => rl.question("\nLanjut ke halaman berikutnya? (y/n): ", res));
                if (answer.trim().toLowerCase() === 'y') {
                    currentPage++;
                } else {
                    keepPaging = false;
                }
            } else {
                keepPaging = false;
            }
        }
        rl.question("\nMasukkan nomor anime yang ingin kamu lihat episodenya: ", async (answer) => {
            const idx = parseInt(answer) - 1;
            if (isNaN(idx) || idx < 0 || idx >= allAnimes.length) {
                console.log("Nomor tidak valid.");
                rl.close();
                return;
            }
            const selectedAnime = allAnimes[idx];
            const animeId = selectedAnime.id;
            try {
                const episodesData = await hianime.getEpisodes(animeId);
                if (!episodesData.episodes || episodesData.episodes.length === 0) {
                    console.log("Tidak ada episode ditemukan.");
                } else {
                    console.log(`\nDaftar episode untuk ${selectedAnime.name}:`);
                    episodesData.episodes.forEach((ep) => {
                        const epLink = `https://hianime.to/watch/${animeId}?ep=${ep.episodeId.split('=')[1]}`;
                        console.log(`Episode ${ep.number}: ${ep.title}`);
                        console.log(`   Link: ${epLink}\n`);
                    });
                }
            } catch (err) {
                console.error("Gagal mengambil episode:", err);
            }
            rl.close();
        });
    } catch (err) {
        console.error("Terjadi kesalahan:", err);
    }
}

// Ambil query dari argumen command line
const query = process.argv.slice(2).join(" ");
if (!query) {
    console.log("Masukkan kata kunci pencarian, contoh: node aniwatch-search.js kaguya");
    process.exit(1);
}
searchAnime(query);
