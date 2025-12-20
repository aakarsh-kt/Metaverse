export type Avatar = {
    avatarID: string;
    name: string;
    imageUrl: string;
};

export async function fetchAvatars(): Promise<Avatar[]> {
    const res = await fetch("http://localhost:3000/api/v1/avatars");
    if (!res.ok) {
        throw new Error(`Failed to fetch avatars (${res.status})`);
    }
    const data = (await res.json()) as { avatars?: Avatar[] };
    return data.avatars ?? [];
}
