export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // ==========================================
        // API UPLOAD FOTO
        // ==========================================
        if (url.pathname === "/api/upload") {
            // Hanya POST
            if (request.method !== "POST") {
                return new Response("Method Not Allowed", {
                    status: 405,
                    headers: {
                        Allow: "POST",
                    },
                });
            }

            // Cek token upload
            const auth = request.headers.get("Authorization");
            const expectedAuth = `Bearer ${env.UPLOAD_TOKEN}`;

            if (!auth || auth !== expectedAuth) {
                return Response.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            const eventId = url.searchParams.get("event");

            if (!eventId) {
                return Response.json(
                    { error: "Event ID belum diberikan" },
                    { status: 400 }
                );
            }

            // Keamanan Event ID
            if (!/^[a-zA-Z0-9_-]+$/.test(eventId)) {
                return Response.json(
                    { error: "Event ID tidak valid" },
                    { status: 400 }
                );
            }

            // Ambil file dari multipart/form-data
            const formData = await request.formData();
            const file = formData.get("file");

            if (!(file instanceof File)) {
                return Response.json(
                    { error: "File tidak ditemukan" },
                    { status: 400 }
                );
            }

            // Hanya izinkan gambar
            if (!file.type.startsWith("image/")) {
                return Response.json(
                    { error: "File harus berupa gambar" },
                    { status: 400 }
                );
            }

            // Bersihkan nama file
            const originalName = file.name || "photo.jpg";

            const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");

            // Nama unik agar tidak bentrok
            const fileName = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;

            const key = `events/${eventId}/${fileName}`;

            // Simpan ke R2
            await env.MEDIA.put(key, await file.arrayBuffer(), {
                httpMetadata: {
                    contentType: file.type,
                },
            });

            return Response.json({
                success: true,
                event: eventId,
                key: key,
                name: fileName,
            });
        }

        // ==========================================
        // API DAFTAR FOTO
        // ==========================================
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

        // ==========================================
        // API AMBIL GAMBAR
        // ==========================================
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

        // ==========================================
        // WEBSITE
        // ==========================================
        return env.ASSETS.fetch(request);
    },
};
