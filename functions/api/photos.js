export async function onRequestGet(context) {
    try {
        const bucket = context.env.MEDIA;

        /*
         * Ambil daftar file dari R2.
         */

        const result = await bucket.list();

        /*
         * Ambil maksimal 5 file.
         */

        const objects = result.objects
            .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
            .slice(0, 5);

        /*
         * Ubah object R2 menjadi
         * data yang bisa dibaca browser.
         */

        const photos = objects.map(object => {
            return {
                name: object.key,

                url: `/api/image/${encodeURIComponent(object.key)}`,

                uploaded: object.uploaded,
            };
        });

        return Response.json({
            success: true,

            photos: photos,
        });
    } catch (error) {
        console.error(error);

        return Response.json(
            {
                success: false,

                message: "Gagal membaca R2.",
            },

            {
                status: 500,
            }
        );
    }
}
