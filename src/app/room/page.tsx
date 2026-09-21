import RoomPage from './RoomPage';

export default async function Room({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const reserved = Array.isArray(sp.reserved) ? sp.reserved[0] === '1' : sp.reserved === '1';
  return <RoomPage reserved={reserved} />;
}