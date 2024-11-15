export const authOptions = {
  // debug: true, // next-auth のデバッグモードを有効化
  providers: [
    {
      id: "gakunin",
      name: "GakuNin RDM",
      type: "oauth",
      clientId: process.env.GAKUNIN_CLIENT_ID,
      clientSecret: process.env.GAKUNIN_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.rdm.nii.ac.jp/oauth2/authorize",
        params: {
          client_id: process.env.GAKUNIN_CLIENT_ID, // クエリパラメータでclient_idを送信
          scope: process.env.OSF_SCOPE || "osf.full_read osf.full_write", // 環境変数でスコープを管理
          response_type: "code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/gakunin`, // 環境変数からリダイレクトURIを構築
        },
      },
      token: {
        url: "https://accounts.rdm.nii.ac.jp/oauth2/token",
        async request(context) {
          const body = new URLSearchParams({
            client_id: process.env.GAKUNIN_CLIENT_ID, // 明示的に client_id を追加
            client_secret: process.env.GAKUNIN_CLIENT_SECRET,
            code: context.params.code, // 認可コード
            grant_type: "authorization_code",
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/gakunin`,
          });

          const res = await fetch("https://accounts.rdm.nii.ac.jp/oauth2/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          });

          const json = await res.json(); // Parse the response body once

          if (!res.ok) {
            throw new Error(`Token request failed: ${res.statusText}`);
          }

          return {
            tokens: json
          }
        }
      },
      userinfo: "https://api.rdm.nii.ac.jp/v2/users/me/",
      profile(profile) {
        if (!profile.data || !profile.data.attributes) {
          throw new Error("Invalid user profile structure");
        }

        const user = {
          id: profile.data.id || "unknown", // Handle missing ID gracefully
          name: profile.data.attributes.full_name || "No Name",
          email: profile.data.attributes.email || "No Email",
        };

        return user
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      // トークンからセッションに必要な情報を追加
      session.accessToken = token.accessToken;
      session.user = {
        ...session.user,
        id: token.id, // トークンのIDをセッションのユーザーに追加
      };
      return session;
    },

    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token; // 必要であれば
      }
      if (user) {
        token.id = user.id; // プロファイルからユーザーIDをトークンに保存
      }
      return token;
    },
  },
};