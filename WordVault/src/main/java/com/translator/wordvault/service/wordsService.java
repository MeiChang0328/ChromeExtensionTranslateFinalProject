package com.translator.wordvault.service;

import com.translator.wordvault.model.words;
import com.translator.wordvault.repository.wordsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class wordsService {

  @Autowired
  private wordsRepository repo;

  public List<words> findAll() {
    return repo.findAll();
  }

  public words findById(Integer id) {
    return repo.findById(id).orElse(null);
  }

  public words create(words w) {
    if (w.getCreatedAt() == null) {
      w.setCreatedAt(LocalDateTime.now());
    }
    return repo.save(w);
  }

  public words update(Integer id, words updated) {
    return repo.findById(id)
            .map(existing -> {
              if (updated.getWord() != null) existing.setWord(updated.getWord());
              if (updated.getTranslation() != null) existing.setTranslation(updated.getTranslation());
              // createdAt 若要維持原值就不改
              return repo.save(existing);
            })
            .orElseGet(() -> {
              // 若查無此 id，視作新增（也可改成回傳 null 由 controller 決定 404）
              if (updated.getCreatedAt() == null) {
                updated.setCreatedAt(LocalDateTime.now());
              }
              return repo.save(updated);
            });
  }

  public void delete(Integer id) {
    repo.deleteById(id);
  }

  public List<words> selectWordByName(String name) {
    return repo.findByWord(name);
  }
}
