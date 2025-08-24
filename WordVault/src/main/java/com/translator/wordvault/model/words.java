package com.translator.wordvault.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "words") // 資料表名稱
public class words {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "id")
  private Integer id;

  @Column(name = "word", nullable = false)
  private String word;

  @Column(name = "translation")
  private String translation;

  @Schema(hidden = true)
  @Column(name = "created_at")
  private LocalDateTime createdAt;
}
