import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
app.use(express.json()); //! JSON 형태로 데이터를 받을 수 있도록 설정

app.use(cors()); //! 클라이언트(프론트엔드)와의 원활한 통신을 위해, Express 서버에 CORS 설정을 추가합니다.

dotenv.config();

//! MongoDB 연결
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB 연결 성공");
  })
  .catch((err) => {
    console.log("MongoDB 연결 실패", err);
  });

//! 사용자 모델 정의
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, //! 고유값 (중복된 아이디 방지)
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema); //! User 모델 생성

//! POST 요청으로 새로운 사용자 생성
app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    //! 비밀번호 암호화
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //! 새로운 사용자 생성
    const newUser = new User({
      username,
      password: hashedPassword,
    });

    //! 사용자 저장
    await newUser.save();
    res.status(201).send("사용자 등록 완료");
  } catch (error) {
    res.status(500).send("서버 에러");
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await User.find(); //! 모든 사용자 조회
    res.status(200).json(users); //! 결과를 JSON 형태로 반환
  } catch (error) {
    res.status(500).send("서버 에러");
  }
});

//! 로그인 API
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    //! 사용자 검색
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).send("사용자를 찾을 수 없습니다.");
    }

    //! 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("비밀번호가 일치하지 않습니다.");
    }

    res.status(200).send("로그인 성공");
  } catch (error) {
    res.status(500).send("서버 에러");
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("서버가 5000번 포트에서 실행 중");
});
