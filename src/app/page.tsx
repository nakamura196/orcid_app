"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function MyData() {
  const { data: session } = useSession() as {
    data: {
      user: {
        id: string;
        name?: string | null;
      };
      accessToken: string;
    } | null;
  };

  const fetchData = async () => {
    if (session && session.user) {
      // サーバー側のエンドポイント経由でデータを取得
      const res = await fetch(`/api/orcid/${session.user.id}`);
      const data = await res.json();
      console.log(data); // ユーザーデータを確認
    }
  };

  return (
    <div>
      {!session ? (
        <button onClick={() => signIn("orcid")}>Sign in</button>
      ) : (
        <>
          <p>Welcome, {session?.user?.name}</p>
          <p>ORCID: {session?.user?.id}</p>
          <p>Access Token: {session?.accessToken}</p>

          <p>
            <button onClick={fetchData}>
              Show My ORCID Data in the Console
            </button>
          </p>

          <button onClick={() => signOut()}>Sign out</button>
        </>
      )}
    </div>
  );
}
