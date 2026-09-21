import RoomPage from './RoomPage';
import NextArrow from '@/components/NextArrow';

export default function Room() {
  return (
    <>
      <RoomPage />
      <NextArrow href="/room/subjects" />
    </>
  );
}