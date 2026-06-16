import { createSlice } from "@reduxjs/toolkit";
import { hasValidConfig } from "@/utils/userConfig";

export const userConfigSlice = createSlice({
  name: 'userConfig',
  initialState: {
    isLoggedIn: hasValidConfig(),
  },
  reducers: {
    setIsLoggedIn: (state, action) => {
      state.isLoggedIn = action.payload;
    },
  },
});

export const { setIsLoggedIn } = userConfigSlice.actions;
export default userConfigSlice.reducer;
export const selectIsLoggedIn = (state: { userConfig: { isLoggedIn: boolean } }) => state.userConfig.isLoggedIn;
