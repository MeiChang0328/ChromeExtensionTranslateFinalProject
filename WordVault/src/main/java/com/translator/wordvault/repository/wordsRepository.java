package com.translator.wordvault.repository;

import com.translator.wordvault.model.words;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface wordsRepository extends JpaRepository<words, Integer> {
  // 依單字查詢
  List<words> findByWord(String word);
}
