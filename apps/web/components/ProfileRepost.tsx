type ProfileRepostProps = {
  username: string;
}

export default function ProfileRepost({ username }: Readonly<ProfileRepostProps>) {
  return (
    <h1>REPOST</h1>
  )
}