({
  access: 'public',
  method: async ({ token }) => {
    // const restored = context.client.restoreSession(token);
    // if (restored) return { status: 'logged' };
    // const data = await api.auth.provider.readSession(token);
    // return { status: data ? 'logged' : 'not logged' };
    console.log({ token });
    return { token, status: 'logged' };
  },
});
