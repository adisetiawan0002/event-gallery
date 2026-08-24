export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // API daftar foto
        if (url.pathname === "/api/photos") {
            const eventId = url.searchParams.get("event");

            if (!eventId) {
                return Response.json(
                    { error: "Event ID belum diberikan" },
                    { status: 400 }
                );
            }

            // Keamanan sederhana
            if (!/^[a-zA-Z0-9_-]+$/.test(eventId)) {
                return Response.json(
                    { error: "Event ID tidak valid" },
                    { status: 400 }
                );
            }

            const prefix = `events/${eventId}/`;

            const result = await env.MEDIA.list({
                prefix: prefix,
            });

            const photos = result.objects
                .filter(object => {
                    return /\.(jpg|jpeg|png|webp)$/i.test(object.key);
                })
                .map(object => {
                    return {
                        name: object.key.substring(prefix.length),
                        url: `/api/image/${encodeURIComponent(object.key)}`,
                    };
                });

            return Response.json({
                event: eventId,
                photos: photos,
            });
        }

        // API mengambil gambar dari R2
        if (url.pathname.startsWith("/api/image/")) {
            const key = decodeURIComponent(
                url.pathname.substring("/api/image/".length)
            );

            const object = await env.MEDIA.get(key);

            if (!object) {
                return new Response("Image not found", {
                    status: 404,
                });
            }

            const headers = new Headers();

            object.writeHttpMetadata(headers);
            headers.set("etag", object.httpEtag);
            headers.set("cache-control", "public, max-age=31536000");

            return new Response(object.body, {
                headers,
            });
        }

        // Website
        return env.ASSETS.fetch(request);
    },
};
