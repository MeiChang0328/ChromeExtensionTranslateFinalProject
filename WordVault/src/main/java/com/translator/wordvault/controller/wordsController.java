package com.translator.wordvault.controller;

import com.translator.wordvault.model.words;
import com.translator.wordvault.service.wordsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@Tag(name = "Words API")
@RestController
@RequestMapping("/api/words")
@CrossOrigin(origins = "*")
public class wordsController {

  @Autowired
  private wordsService service;

  @Operation(summary = "列出全部單字")
  @GetMapping
  public ResponseEntity<List<words>> getAll() {
    return ResponseEntity.ok(service.findAll());
  }

  @Operation(summary = "依 ID 取得單字")
  @GetMapping("/{id}")
  public ResponseEntity<words> getById(@PathVariable Integer id) {
    words w = service.findById(id);
    if (w == null) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(w);
  }

  @Operation(summary = "新增單字")
  @PostMapping
  public ResponseEntity<words> create(@RequestBody words w) {
    words saved = service.create(w);
    return ResponseEntity.created(URI.create("/api/words/" + saved.getId())).body(saved);
  }

  @Operation(summary = "更新單字（不存在就新增）")
  @PutMapping("/{id}")
  public ResponseEntity<words> update(@PathVariable Integer id, @RequestBody words w) {
    words saved = service.update(id, w);
    return ResponseEntity.ok(saved);
  }

  @Operation(summary = "刪除單字")
  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Integer id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  @Operation(summary = "依單字查詢（回傳 List）", description = "GET /api/words/search?name=apple")
  @GetMapping("/search")
  public ResponseEntity<List<words>> selectWordByName(@RequestParam String name) {
    return ResponseEntity.ok(service.selectWordByName(name));
  }

  @Operation(summary = "依單字查詢（只取第一筆的字串）", description = "GET /api/words/search/one?name=apple")
  @GetMapping("/search/one")
  public ResponseEntity<String> selectOneWord(@RequestParam String name) {
    List<words> list = service.selectWordByName(name);
    if (list == null || list.isEmpty()) return ResponseEntity.notFound().build();
    return ResponseEntity.ok(list.get(0).getWord());
  }
}
