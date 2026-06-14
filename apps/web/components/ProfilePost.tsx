type ProfilePostProps = {
  username: string;
}

export default function ProfilePost({ username }: Readonly<ProfilePostProps>) {
  return (
    <h1>POST</h1>
  )
}